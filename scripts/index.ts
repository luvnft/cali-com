import axios from "axios";
import { Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { withPaymentInterceptor, decodeXPaymentResponse } from "x402-axios";
import dotenv from "dotenv";
dotenv.config();
const privateKey = process.env.PRIVATE_KEY as Hex;

const baseURL = "http://localhost:3000"; // e.g. https://example.com
const endpointPath = "/test";

const account = privateKeyToAccount(privateKey);
const api = withPaymentInterceptor(
  axios.create({
    baseURL,
  }),
  account
);

api
  .post(endpointPath, {
    attendeeName: "Booker's name",
    attendeeEmail: "Booker's email",
    startTime: "2025-06-12T05:00:00.000Z",
    username: "username-cal from cal.com",
    eventTypeSlug: "30min",
  })
  .then((response) => {
    console.log(response.data);

    const paymentResponse = decodeXPaymentResponse(
      response.headers["x-payment-response"]
    );
    console.log(paymentResponse);
  })
  .catch((error) => {
    console.error(error.response?.data);
  });
