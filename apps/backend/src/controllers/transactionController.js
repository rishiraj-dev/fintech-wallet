const prisma = require('../utils/prisma');
const businessConfig = require('../config/business.json');
const { validateAmount } = require('../middlewares/sanitization');

async function getTransactions(req, res, next) {
  try {
    const { limit = 10, offset = 0, type } = req.query;
    const userId = req.user.id;

    // Build filter conditions based on type from user's perspective
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
  try {
    const { type, amount, recipientId } = req.body;
    const userId = req.user.id;

    // validation
    if (!type || !['CREDIT', 'DEBIT'].includes(type)) {
      return res.status(400).json({ error: 'Invalid transaction type. Must be CREDIT or DEBIT' });
    }

    if (!validateAmount(amount)) {
      return res.status(400).json({ error: 'Invalid amount. Must be a positive number' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    if (amount < businessConfig.minTransactionAmount) {
      return res.status(400).json({ 
        error: `Minimum transaction amount is ${businessConfig.minTransactionAmount}` 
      });
    }

    if (amount > businessConfig.maxTransactionLimit) {
      return res.status(400).json({ 
        error: `Maximum transaction limit is ${businessConfig.maxTransactionLimit}` 
      });
    }

    if (type === 'DEBIT' && !recipientId) {
      return res.status(400).json({ error: 'Recipient is required for debit transactions' });
    }

    if (type === 'DEBIT' && recipientId === userId) {
      return res.status(400).json({ error: 'Cannot transfer to yourself' });
    }

    // calc fee for debit transactions
    const fee = type === 'DEBIT' ? amount * businessConfig.feePercentage : 0;
    const totalDeduction = type === 'DEBIT' ? parseFloat(amount) + parseFloat(fee) : 0;

    // using Prisma transaction for ACID compliance
    const result = await prisma.$transaction(async (tx) => {
      if (type === 'DEBIT') {
        // verify recipient exists
        const recipient = await tx.user.findFirst({
          where: { id: recipientId, deletedAt: null }
        });

        if (!recipient) {
          throw new Error('Recipient not found');
        }

        // verify sender has sufficient balance
        const sender = await tx.user.findUnique({
          where: { id: userId }
        });

        if (parseFloat(sender.balance) < totalDeduction) {
          throw new Error('Insufficient balance');
        }

        // deduct from sender
        await tx.user.update({
          where: { id: userId },
          data: { balance: { decrement: totalDeduction } }
        });

        // add to recipient
        await tx.user.update({
          where: { id: recipientId },
          data: { balance: { increment: amount } }
        });

        // create transaction record
        const transaction = await tx.transaction.create({
          data: {
            type: 'DEBIT',
            amount,
            fee,
            status: 'completed',
            senderId: userId,
            recipientId,
            description: `Transfer to ${recipient.name}`
          }
        });

        return transaction;
      } else {
        // CREDIT
        await tx.user.update({
          where: { id: userId },
          data: { balance: { increment: amount } }
        });

        const transaction = await tx.transaction.create({
          data: {
            type: 'CREDIT',
            amount,
            status: 'completed',
            recipientId: userId,
            description: 'Added money to wallet'
          }
        });

        return transaction;
      }
    });

    // fetch updated user balance
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
    if (error.message === 'Insufficient balance') {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'Recipient not found') {
      return res.status(404).json({ error: error.message });
    }
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
