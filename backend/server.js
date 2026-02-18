require("dotenv").config();

console.log("Loaded KEY:", process.env.KEY_ID);

const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const razorpay = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});


// 🔹 CREATE ORDER
app.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    const order = await razorpay.orders.create({
      amount: amount,   // ✅ DO NOT multiply again
      currency: "INR"
    });

    res.json(order);

  } catch (err) {
    console.log("RAZORPAY ERROR:", err);
    res.status(500).json({ error: "Order creation failed" });
  }
});



// 🔹 VERIFY PAYMENT
app.post("/verify-payment", (req, res) => {

  try {

    console.log("VERIFY DATA:", req.body);

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    // 🔥 FIX: ensure signature exists
    if (!razorpay_signature) {
      console.log("❌ Signature missing from frontend");
      return res.json({ success: false });
    }

    const hmac = crypto.createHmac("sha256", process.env.KEY_SECRET);

    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);

    const generated_signature = hmac.digest("hex");

    console.log("Generated:", generated_signature);
    console.log("Received :", razorpay_signature);

    if (generated_signature === razorpay_signature) {
      console.log("✅ PAYMENT VERIFIED");
      res.json({ success: true });
    } else {
      console.log("❌ SIGNATURE MISMATCH");
      res.json({ success: false });
    }

  } catch (err) {
    console.log("VERIFY ERROR:", err);
    res.json({ success: false });
  }

});


app.listen(5000, () => console.log("Server running on port 5000"));
