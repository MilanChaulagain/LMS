import { Webhook } from "svix";
import Stripe from "stripe";
import User from "../models/User.js";
import { Purchase } from "../models/Purchase.js";
import Course from "../models/Course.js";

// Needed to read raw body
import getRawBody from 'raw-body';
import connectDB from "../configs/mongodb.js";

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

// Clerk Webhook Handler
export const clerkWebhooks = async (req, res) => {
  try {
    await connectDB(); 
    const payload = await getRawBody(req); // Get raw body
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    
    const evt = whook.verify(payload, {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

    console.log("✅ Clerk event received:", evt.type);

    const { data, type } = evt;

    switch (type) {
        case 'user.created': {
            try {
              const userData = {
                _id: data.id,
                email: data.email_addresses?.[0]?.email_address ?? null,
                name: (data.first_name ?? '') + " " + (data.last_name ?? ''),
                imageUrl: data.image_url ?? '',
              };
              console.log("Creating user in MongoDB with:", userData);
              await User.create(userData);
              res.status(200).json({});
            } catch (err) {
              console.error("Error saving user to MongoDB:", err.message);
              res.status(500).json({success: false, message: err.message});
            }
            break;
          }

      case 'user.updated': {
        const userData = {
          email: data.email_addresses[0].email_address,
          name: data.first_name + " " + data.last_name,
          imageUrl: data.image_url,
        };
        await User.findByIdAndUpdate(data.id, userData);
        res.status(200).json({});
        break;
      }

      case 'user.deleted': {
        await User.findByIdAndDelete(data.id);
        res.status(200).json({});
        break;
      }

      default:
        res.status(200).json({});
        break;
    }
  } catch (error) {
    console.error('Clerk webhook error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Stripe Webhook Handler
export const stripeWebhooks = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    const payload = await getRawBody(req); // Get raw body for Stripe too
    event = Stripe.webhooks.constructEvent(payload, sig, endpointSecret);
  } catch (error) {
    console.error('Stripe webhook error:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const paymentIntentId = paymentIntent.id;

        const sessionList = await stripeInstance.checkout.sessions.list({
          payment_intent: paymentIntentId
        });

        const { purchaseId } = sessionList.data[0].metadata;
        const purchaseData = await Purchase.findById(purchaseId);
        const userData = await User.findById(purchaseData.userId);
        const courseData = await Course.findById(purchaseData.courseId.toString());

        courseData.enrolledStudents.push(userData._id);
        await courseData.save();

        userData.enrolledCourses.push(courseData._id);
        await userData.save();

        purchaseData.status = 'completed';
        await purchaseData.save();

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const paymentIntentId = paymentIntent.id;

        const sessionList = await stripeInstance.checkout.sessions.list({
          payment_intent: paymentIntentId
        });

        const { purchaseId } = sessionList.data[0].metadata;
        const purchaseData = await Purchase.findById(purchaseId);

        purchaseData.status = 'failed';
        await purchaseData.save();
        
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Stripe event handling error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
