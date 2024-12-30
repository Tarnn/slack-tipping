import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { getLoadingData } from "~/lib/redis";
import { app } from "~/lib/slack";
import { db } from "~/server/db";
import { type EngineWebhookPayload } from "~/types/engine";

type User = {
  real_name?: string;
  profile?: { display_name?: string };
  name?: string;
  id?: string;
};

const getUserNameFromProfile = (profile: User) => {
  return profile.real_name ?? 
         profile.profile?.display_name ?? 
         profile.name ??
         profile.id ??
         "Unknown User";
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as EngineWebhookPayload;
    console.log('Received webhook:', JSON.stringify(body, null, 2));

    // Only process mined transactions
    if (body.status !== 'mined') {
      return NextResponse.json({ ok: true });
    }

    // Get the loading message data from Redis
    const messageData = await getLoadingData(body.queueId);
    if (!messageData) {
      console.log('No loading message found for queue ID:', body.queueId);
      return NextResponse.json({ ok: true });
    }

    // Get the installation for this team
    const installation = await db.slackInstall.findFirst();
    if (!installation?.botToken) {
      console.error('No bot token found');
      return NextResponse.json({ error: 'No bot token found' }, { status: 400 });
    }

    // Update the message
    try {
      // read the profile of each receipient
      const [senderProfile, ...receiverProfiles] = await Promise.all([
        app.client.users.info({
          token: installation.botToken,
          user: messageData.senderUserId
        }),
        ...messageData.receiverUserIds.map(async (userId) => {
          const profile = await app.client.users.info({
            token: installation.botToken!,
            user: userId
          });
          return profile;
        })
      ]);
      // DM the sender and all the receivers
      const result = await app.client.chat.postMessage({
        token: installation.botToken,
        channel: messageData.senderUserId,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: ":white_check_mark: *Your tip has been sent successfully!*"
            }
          },
          {
            type: "section", 
            text: {
              type: "mrkdwn",
              text: `Recipients: ${receiverProfiles.map(profile => `*${getUserNameFromProfile(profile.user!)}*`).map((name, i, arr) => {
                if (i === arr.length - 1 && arr.length > 1) {
                  return `and ${name}`;
                }
                return name;
              }).join(', ')}`
            }
          }
        ],
        text: `✅ Your tip has been sent successfully!` // Fallback text
      });
      for (const receiverUserId of messageData.receiverUserIds) {
        await app.client.chat.postMessage({
          token: installation.botToken,
          channel: receiverUserId,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: ":tada: *You received a tip!*"
              }
            },
            {
              type: "section",
              text: {
                type: "mrkdwn", 
                text: `Sent by *${getUserNameFromProfile(senderProfile.user!)}*`
              }
            }
          ],
          text: `✅ You received a tip from ${getUserNameFromProfile(senderProfile.user!)}!` // Fallback text
        });
      }
      console.log('Updated message:', result);
    } catch (error) {
      console.error('Error updating message:', JSON.stringify(error, null, 2));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 