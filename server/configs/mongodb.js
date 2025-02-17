import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/learnIT`, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log("Database Connected");
    } catch (error) {
        console.error("MongoDB Connection Error:", error);
        process.exit(1); // Exit the process if connection fails
    }
};

export default connectDB;
