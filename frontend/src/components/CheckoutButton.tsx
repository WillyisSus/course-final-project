import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import api from "@/lib/axios"; //
import { toast } from "sonner";
import { useNavigate } from "react-router";

// We need these props to tell the backend WHO is paying for WHAT
interface CheckoutButtonProps {
  amount: number;
  product_id: number;
  seller_id: number;
}

const CheckoutButton = ({
  amount,
  product_id,
  seller_id,
}: CheckoutButtonProps) => {
  const navigate = useNavigate();

  // Configuration for the PayPal SDK
  const initialOptions = {
    // REPLACE THIS with your actual Sandbox Client ID from developer.paypal.com
    // clientId:
    //   "Abq0Ui9c09fNJmCsd6ksRKnyUdd-wzXV5Nt5ytnVjnwJEkjH8sug8wxWlLKjj6QNHhk37jXYJHoeFv6L",
    clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
    currency: "USD",
    intent: "capture",
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <div className="z-0 relative">
        {" "}
        {/* z-0 fixes some overlay issues */}
        <PayPalButtons
          style={{ layout: "vertical", shape: "rect", color: "gold" }}
          // STEP 1: START THE PAYMENT
          createOrder={async (data, actions) => {
            try {
              // Call YOUR backend to create the order securely
              const response = await api.post("/payment/create-order", {
                product_id: product_id, // Backend will look up the price from DB
              });
              return response.data.id; // Return the PayPal Order ID to the popup
            } catch (error: any) {
              console.error("Create Order Error:", error);
              toast.error("Could not initiate payment. Try again.");
              throw error;
            }
          }}
          // STEP 2: FINALIZE THE PAYMENT
          onApprove={async (data, actions) => {
            try {
              toast.info("Processing payment...");

              // Call YOUR backend to capture funds & save receipt
              const response = await api.post("/payment/capture-order", {
                orderID: data.orderID, // The ID from PayPal
                product_id,
              });

              if (response.data.status === "FINISHED") {
                toast.success("Payment Successful! Receipt emailed.");
              }
              console.log("Capture Response:", response.data);
            } catch (error: any) {
              console.error("Capture Error:", error);
              toast.error("Payment failed. Please check your balance.");
            }
          }}
          onError={(err) => {
            console.error("PayPal SDK Error:", err);
            toast.error("PayPal encountered an error.");
          }}
        />
      </div>
    </PayPalScriptProvider>
  );
};

export default CheckoutButton;
