const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fintech Wallet API',
      version: '1.0.0',
      description: 'A secure fintech wallet API with cookie-based authentication, P2P transfers, and transaction management',
      contact: {
        name: 'API Support',
        email: ''
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
    //   {
    //     url: '',
    //     description: 'Production server'
    //   }
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'HttpOnly cookie containing JWT token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID'
            },
            name: {
              type: 'string',
              description: 'User full name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            balance: {
              type: 'number',
              format: 'decimal',
              description: 'Current wallet balance'
            }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Transaction ID'
            },
            type: {
              type: 'string',
              enum: ['CREDIT', 'DEBIT'],
              description: 'Transaction type'
            },
            amount: {
              type: 'number',
              format: 'decimal',
              description: 'Transaction amount'
            },
            fee: {
              type: 'number',
              format: 'decimal',
              description: 'Transaction fee (for debit transactions)'
            },
            description: {
              type: 'string',
              description: 'Transaction description'
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'failed'],
              description: 'Transaction status'
            },
            sender: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                email: { type: 'string' }
              }
            },
            recipient: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                email: { type: 'string' }
              }
            },
            date: {
              type: 'string',
              format: 'date-time',
              description: 'Transaction timestamp'
            }
          }
        },
        BusinessConfig: {
          type: 'object',
          properties: {
            feePercentage: {
              type: 'number',
              description: 'Fee percentage for debit transactions (0.02 = 2%)'
            },
            maxTransactionLimit: {
              type: 'number',
              description: 'Maximum allowed transaction amount'
            },
            minTransactionAmount: {
              type: 'number',
              description: 'Minimum allowed transaction amount'
            },
            creditEnabled: {
              type: 'boolean',
              description: 'Whether credit transactions are enabled'
            },
            debitEnabled: {
              type: 'boolean',
              description: 'Whether debit transactions are enabled'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and session management'
      },
      {
        name: 'User',
        description: 'User profile and search operations'
      },
      {
        name: 'Transactions',
        description: 'Transaction management and history'
      },
      {
        name: 'Configuration',
        description: 'Business rules and configuration'
      },
      {
        name: 'Health',
        description: 'Server health and status'
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/index.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
