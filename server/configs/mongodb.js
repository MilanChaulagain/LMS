import mongoose from "mongoose";

//Connect to the MongoDB database

const connectDB = async ()=> {
    // Attach helpful event listeners
    mongoose.connection.on('connected', ()=> console.log('✅ Database Connected'))
    mongoose.connection.on('error', (err)=> console.error('❌ Database Connection Error:', err.message))
    mongoose.connection.on('disconnected', ()=> console.log('⚠️ Database Disconnected - will attempt to reconnect'))

    const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000, // Timeout after 10s instead of 30s
        socketTimeoutMS: 450000, // Close sockets after 450s of inactivity
        family: 4, // Use IPv4, helps in some environments
    }

    // Retry connection logic with exponential backoff (capped)
    const connectWithRetry = async (attempt = 0) => {
        const maxDelay = 30000 // 30s
        const baseDelay = 2000 // 2s
        const delay = Math.min(maxDelay, baseDelay * Math.pow(2, attempt))

        try {
            console.log('🔗 Attempting to connect to MongoDB... (attempt', attempt + 1, ')')
            await mongoose.connect(`${process.env.MONGODB_URI}/learnIT`, options)
            console.log('✅ MongoDB connected')
        } catch (error) {
            console.error('❌ MongoDB Connection Failed:', error.message)
            console.error(`Retrying connection in ${Math.round(delay/1000)}s...`)
            setTimeout(() => connectWithRetry(attempt + 1), delay)
        }
    }

    // Start initial connection attempts
    await connectWithRetry()
}

export default connectDB