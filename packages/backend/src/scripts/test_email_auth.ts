
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

console.log("\n📧 EMAIL AUTHENTICATION DIAGNOSTIC TOOL");
console.log("=======================================");

if (!EMAIL_USER || !EMAIL_PASS) {
    console.error("❌ CRITICAL: EMAIL_USER or EMAIL_PASS is missing in .env file.");
    process.exit(1);
}

console.log(`👤 User: ${EMAIL_USER}`);
// Mask password for display
const maskedPass = EMAIL_PASS.length > 4
    ? `${EMAIL_PASS.substring(0, 2)}${"*".repeat(EMAIL_PASS.length - 4)}${EMAIL_PASS.substring(EMAIL_PASS.length - 2)}`
    : "****";
console.log(`🔑 Pass: ${maskedPass} (Length: ${EMAIL_PASS.length} chars)`);

// Analysis of Credentials
console.log("\n🔍 Analyzing Credentials...");
let likelyAppPassword = false;

if (EMAIL_PASS.length === 16 && !EMAIL_PASS.includes(" ")) {
    console.log("✅ Password length is 16 characters. This looks like a correct Google App Password.");
    likelyAppPassword = true;
} else if (EMAIL_PASS.includes(" ")) {
    console.log("⚠️  Password contains spaces. App Passwords should usually be used without spaces in .env, though Google displays them with spaces.");
} else {
    console.log("⚠️  Password length is " + EMAIL_PASS.length + ". Google App Passwords are typically exactly 16 characters.");
    console.log("   If this is your regular Gmail login password, IT WILL NOT WORK.");
}

console.log("\n🔄 Attempting to connect to Gmail...");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },
});

transporter.verify((error, success) => {
    if (error) {
        console.error("\n❌ CONNECTION FAILED!");
        console.error("---------------------");
        console.error(`Error Code: ${error.name}`);
        console.error(`Message:    ${error.message}`);

        if ((error as any).responseCode === 535) {
            console.log("\n🛑 DIAGNOSIS: AUTHENTICATION FAILED");
            console.log("   Google rejected your email/password combination.");
            if (!likelyAppPassword) {
                console.log("   👉 CAUSE: You are likely using your personal login password.");
                console.log("   👉 FIX:   You MUST generate an 'App Password'.");
            } else {
                console.log("   👉 CAUSE: The App Password might be revoked, typoed, or for the wrong account.");
            }
            console.log("\n🛠️  HOW TO FIX:");
            console.log("   1. Go to https://myaccount.google.com/security");
            console.log("   2. Turn on '2-Step Verification' (if not already on).");
            console.log("   3. Search for 'App Passwords'.");
            console.log("   4. Create one named 'HMS'.");
            console.log("   5. Replaces EMAIL_PASS in your .env file with the new 16-character code.");
        }
        process.exit(1);
    } else {
        console.log("\n✅ SUCCESS! Authentication working correctly.");
        console.log("   The backend should now be able to send emails.");
        process.exit(0);
    }
});
