import express from "express"
import cors from "cors"
import 'dotenv/config'
import connectDB from "./configs/mongodb.js"
import { stripeWebhooks } from "./controllers/webhooks.js"
import educatorRouter from "./routes/educatorRoutes.js"
import connectCloudinary from "./configs/cloudinary.js"
import courseRouter from "./routes/courseRoutes.js"
import userRouter from "./routes/userRoutes.js"
import blogRouter from "./routes/blogRoutes.js"

//Initialize express
const app = express()

//Connect to Database
await connectDB()
await connectCloudinary()

//Middlewares

app.use(cors())

// Increase payload size limit for video uploads (500MB)
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));


//Routes
app.get('/', (req, res)=> res.send("API working"))
app.use('/api/educator', educatorRouter)
app.use('/api/course', courseRouter)
app.use('/api/user', userRouter)
app.use('/api/blog', blogRouter)
app.post('/stripe', express.raw({type: 'application/json'}), stripeWebhooks)

//PORT
const PORT = process.env.PORT || 5000

app.listen(PORT, ()=> {
    console.log(`Server is running on port ${PORT}`)
})



