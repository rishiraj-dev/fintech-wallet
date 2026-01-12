const prisma = require('../utils/prisma');
const businessConfig = require('../config/business.json');
const { validateAmount } = require('../middlewares/sanitization');

async function getTransactions(req, res, next) {
  try {
    const { limit = 10, offset = 0, type, status, startDate, endDate } = req.query;
    const userId = req.user.id;

    let where = {
      deletedAt: null
    };

    if (type && ['CREDIT', 'DEBIT'].includes(type)) {
      if (type === 'DEBIT') {
        where.senderId = userId;
      } else if (type === 'CREDIT') {
        where.recipientId = userId;
      }
    } else {
      where.OR = [
        { senderId: userId },
        { recipientId: userId }
      ];
    }

    if (status && ['completed', 'pending', 'failed'].includes(status)) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    //  transactions with pagination
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          sender: {
            select: { id: true, name: true, email: true }
          },
          recipient: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.transaction.count({ where })
    ]);

    const formattedTransactions = transactions.map(tx => {
      const isSender = tx.senderId === userId;
      const isRecipient = tx.recipientId === userId;
      
      let transactionType;
      if (isSender && !isRecipient) {
        transactionType = 'DEBIT';
      } else if (isRecipient && !isSender) {
        transactionType = 'CREDIT';
      } else {
        transactionType = tx.type;
      }

      return {
        id: tx.id,
        type: transactionType,
        amount: tx.amount,
        fee: tx.fee || 0,
        description: tx.description,
        status: tx.status,
        errorMessage: tx.errorMessage,
        sender: tx.sender,
        recipient: tx.recipient,
        date: tx.createdAt
      };
    });

    res.json({
      data: formattedTransactions,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        page: Math.floor(parseInt(offset) / parseInt(limit)) + 1
      }
    });
  } catch (error) {
    next(error);
  }
}

async function createTransaction(req, res, next) {
  const { type, amount, recipientId } = req.body;
  const userId = req.user.id;

  // Calculate fee early so it's available in catch block
  const numAmount = parseFloat(amount) || 0;
  const fee = (type === 'DEBIT' && numAmount > 0) ? numAmount * businessConfig.feePercentage : 0;

  // Helper function to log failed transaction
  const logFailedTransaction = async (errorMessage) => {
    try {
      const failedTransactionData = {
        type: type || 'UNKNOWN',
        amount: numAmount,
        fee: parseFloat(fee) || 0,
        status: 'failed',
        errorMessage: errorMessage
      };

      if (type === 'DEBIT') {
        failedTransactionData.senderId = userId;
        failedTransactionData.description = recipientId ? `Failed transfer to recipient ID ${recipientId}` : 'Failed transfer';
        
        if (errorMessage !== 'Recipient not found' && recipientId) {
          failedTransactionData.recipientId = recipientId;
        }
      } else if (type === 'CREDIT') {
        failedTransactionData.recipientId = userId;
        failedTransactionData.description = 'Failed to add money to wallet';
      } else {
        failedTransactionData.description = 'Failed transaction';
      }

      console.log('Logging failed transaction:', failedTransactionData);
      
      await prisma.transaction.create({
        data: failedTransactionData
      });
      
      console.log('Failed transaction logged successfully');
    } catch (createError) {
      console.error('Failed to log failed transaction:', createError);
      console.error('Error details:', createError.message, createError.stack);
    }
  };

  try {
    // validation
    if (!type || !['CREDIT', 'DEBIT'].includes(type)) {
      await logFailedTransaction('Invalid transaction type. Must be CREDIT or DEBIT');
      return res.status(400).json({ error: 'Invalid transaction type. Must be CREDIT or DEBIT' });
    }

    if (!validateAmount(amount)) {
      await logFailedTransaction('Invalid amount. Must be a positive number');
      return res.status(400).json({ error: 'Invalid amount. Must be a positive number' });
    }

    if (numAmount <= 0) {
      await logFailedTransaction('Amount must be greater than 0');
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    if (numAmount < businessConfig.minTransactionAmount) {
      const error = `Minimum transaction amount is ${businessConfig.minTransactionAmount}`;
      await logFailedTransaction(error);
      return res.status(400).json({ error });
    }

    if (numAmount > businessConfig.maxTransactionLimit) {
      const error = `Maximum transaction limit is ${businessConfig.maxTransactionLimit}`;
      await logFailedTransaction(error);
      return res.status(400).json({ error });
    }

    if (type === 'DEBIT' && !recipientId) {
      await logFailedTransaction('Recipient is required for debit transactions');
      return res.status(400).json({ error: 'Recipient is required for debit transactions' });
    }

    if (type === 'DEBIT' && recipientId === userId) {
      await logFailedTransaction('Cannot transfer to yourself');
      return res.status(400).json({ error: 'Cannot transfer to yourself' });
    }

    const totalDeduction = type === 'DEBIT' ? numAmount + fee : 0;

    try {
      const result = await prisma.$transaction(async (tx) => {
        if (type === 'DEBIT') {
          const recipient = await tx.user.findFirst({
            where: { id: recipientId, deletedAt: null }
          });

          if (!recipient) {
            throw new Error('Recipient not found');
          }

          const sender = await tx.user.findUnique({
            where: { id: userId }
          });

          if (parseFloat(sender.balance) < totalDeduction) {
            throw new Error('Insufficient balance');
          }

          await tx.user.update({
            where: { id: userId },
            data: { balance: { decrement: totalDeduction } }
          });

          await tx.user.update({
            where: { id: recipientId },
            data: { balance: { increment: numAmount } }
          });

          const transaction = await tx.transaction.create({
            data: {
              type: 'DEBIT',
              amount: numAmount,
              fee,
              status: 'completed',
              senderId: userId,
              recipientId,
              description: `Transfer to ${recipient.name}`
            }
          });

          return transaction;
        } else {
          await tx.user.update({
            where: { id: userId },
            data: { balance: { increment: numAmount } }
          });

          const transaction = await tx.transaction.create({
            data: {
              type: 'CREDIT',
              amount: numAmount,
              status: 'completed',
              recipientId: userId,
              description: 'Added money to wallet'
            }
          });

          return transaction;
        }
      });

      const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { balance: true }
      });

      res.status(201).json({
        message: 'Transaction successful',
        transactionId: result.id,
        newBalance: updatedUser.balance
      });
    } catch (error) {
      let errorMessage = error.message;
      let statusCode = 400;

      if (error.message === 'Recipient not found') {
        statusCode = 404;
      }

      await logFailedTransaction(errorMessage);

      return res.status(statusCode).json({ error: errorMessage });
    }
  } catch (error) {
    // Log failed transaction for any unexpected errors
    await logFailedTransaction(error.message || 'Unknown error occurred');
    next(error);
  }
}

async function deleteTransaction(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // verify transaction exists and belongs to user
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: parseInt(id),
        OR: [
          { senderId: userId },
          { recipientId: userId }
        ],
        deletedAt: null
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // soft delete by setting deletedAt timestamp
    await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date() }
    });

    res.json({ message: 'Transaction hidden' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTransactions,
  createTransaction,
  deleteTransaction
};
