import { Webhook } from "svix";
import User from "../models/User.js";
import { json } from "express";

//API controller function to Manage Clerk User with Database

export const clerkWebhooks = async (req, res) => {
    try {
        console.log("Received webhook event:", req.body);

        const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

        await whook.verify(JSON.stringify(req.body), {
            "svix-id": req.headers["svix-id"],
            "svix-timestamp": req.headers["svix-timestamp"],
            "svix-signature": req.headers["svix-signature"],
        });

        console.log("Webhook verified successfully");

        const { data, type } = req.body;

        switch (type) {
            case "user.created": {
                const userData = {
                    _id: data.id,
                    email: data.email_addresses?.[0]?.email_address || "",
                    name: `${data.first_name} ${data.last_name}`,
                    imageUrl: data.image_url,
                };

                console.log("User data to save:", userData);

                const newUser = await User.create(userData);
                console.log("User created:", newUser);

                res.json({ success: true });
                break;
            }
            case "user.updated": {
                const userData = {
                    email: data.email_addresses?.[0]?.email_address || "",
                    name: `${data.first_name} ${data.last_name}`,
                    imageUrl: data.image_url,
                };

                console.log("Updating user with ID:", data.id);

                await User.findByIdAndUpdate(data.id, userData);
                console.log("User updated successfully");

                res.json({ success: true });
                break;
            }
            case "user.deleted": {
                console.log("Deleting user with ID:", data.id);

                await User.findByIdAndDelete(data.id);
                console.log("User deleted successfully");

                res.json({ success: true });
                break;
            }
            default:
                console.log("Unhandled event type:", type);
                res.json({ success: false, message: "Unhandled event type" });
                break;
        }
    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

