const amqp = require('amqplib');
const nodemailer = require('nodemailer');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const QUEUE_NAME = 'notification_events';

async function main() {
    console.log("Setting up Ethereal Mail account...");
    const testAccount = await nodemailer.createTestAccount();
    
    const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });

    console.log("Connecting to RabbitMQ...");
    let connection;
    try {
        connection = await amqp.connect(RABBITMQ_URL);
    } catch (e) {
        console.error("Failed to connect to RabbitMQ. Make sure it is running.");
        process.exit(1);
    }
    
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    
    console.log(`Waiting for messages in ${QUEUE_NAME}...`);
    
    channel.consume(QUEUE_NAME, async (msg) => {
        if (msg !== null) {
            try {
                const event = JSON.parse(msg.content.toString());
                console.log("Received event:", event.event_type);
                
                const { id, name, status, score, email } = event.merchant;
                let subject = "";
                let html = "";
                
                if (event.event_type === "ONBOARDING_STATUS_CHANGED") {
                    if (status === "APPROVED") {
                        subject = `Welcome to SentinelPay! Your account is Approved`;
                        html = `
                            <h2>Welcome, ${name}!</h2>
                            <p>Great news! Your merchant account has been approved.</p>
                            <p><strong>Trust Score:</strong> ${score}/100</p>
                            <p>You can now start processing payments.</p>
                        `;
                    } else if (status === "PENDING_REMEDIATION") {
                        subject = `Action Required: SentinelPay Onboarding`;
                        html = `
                            <h2>Hello ${name},</h2>
                            <p>We encountered some issues while reviewing your application. You have a <strong>48-hour grace period</strong> to resolve them.</p>
                            <p>Please log in to your dashboard to review the flagged items.</p>
                        `;
                    } else if (status === "REJECTED") {
                        subject = `Update on your SentinelPay Application`;
                        html = `
                            <h2>Hello ${name},</h2>
                            <p>Unfortunately, we cannot approve your merchant account at this time.</p>
                        `;
                    }
                }
                
                if (subject) {
                    const info = await transporter.sendMail({
                        from: '"SentinelPay Support" <no-reply@sentinelpay.demo>',
                        to: email || "merchant@example.com",
                        subject: subject,
                        html: html,
                    });
                    console.log(`Email sent for Merchant #${id} (${status})`);
                    console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
                }
                
                channel.ack(msg);
            } catch (err) {
                console.error("Error processing message:", err);
                channel.ack(msg); // ack to remove invalid messages
            }
        }
    });
}

main().catch(console.error);
