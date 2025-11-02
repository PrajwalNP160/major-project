import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || 'skillswap_db',
  process.env.MYSQL_USERNAME || 'root',
  process.env.MYSQL_PASSWORD || '',
  {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: process.env.MYSQL_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false,
      connectTimeout: 60000,
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Test the connection
export const connectMySQL = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connection established successfully');
    
    // Sync all models (use force: false to avoid dropping existing data)
    await sequelize.sync({ alter: false });
    console.log('✅ MySQL models synchronized');
    
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to MySQL:', error);
    console.error('Error details:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    
    // If it's an SSL error, provide helpful guidance
    if (error.code === 'ER_UNKNOWN_ERROR' && error.sqlMessage?.includes('insecure transport')) {
      console.error('💡 Hint: Your MySQL server requires SSL connections. Set MYSQL_SSL=true in your .env file');
    }
    
    return false;
  }
};

export default sequelize;
