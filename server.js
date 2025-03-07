const express = require("express");
const cors = require("cors");
const Retell = require("retell-sdk");
const admin = require("firebase-admin");
const serviceAccount = require("./firebase-config.json");
const https = require("https");
const fs = require("fs");
const os = require("os");
const path = require("path");
const webhookRoutes = require("./src/routes/webhookRoutes");

const app = express();

// Initialize Firebase Admin with service account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "wannes-whitelabelled.appspot.com",
}, "appTwo");

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Initialize Retell client
const client = new Retell({
  apiKey: "key_b519607900dcb828b833ac62086a",
});

// Middleware
app.use(cors());
app.use(express.json());

// List voices endpoint
app.get("/api/list-voices", async (req, res) => {
  try {
    const voiceResponses = await client.voice.list();

    res.json({
      success: true,
      voices: voiceResponses,
    });
  } catch (error) {
    console.error("Error listing voices:", error);
    res.status(500).json({
      success: false,
      error: "Failed to list voices",
    });
  }
});

// List knowledge bases endpoint
app.get("/api/list-knowledge-bases", async (req, res) => {
  try {
    const knowledgeBases = await client.knowledgeBase.list();
    res.json(knowledgeBases);
  } catch (error) {
    console.error("Error listing knowledge bases:", error);
    res.status(500).json({
      success: false,
      error: "Failed to list knowledge bases",
    });
  }
});

// List agents endpoint
app.get("/api/list-agents", async (req, res) => {
  try {
    const { user_id, workspace_id } = req.query;

    if (!user_id || !workspace_id) {
      return res.status(400).json({
        success: false,
        error: "User ID and workspace ID are required",
      });
    }

    // Get agents from Firestore
    const agentsRef = db
      .collection("users")
      .doc(user_id)
      .collection("workspaces")
      .doc(workspace_id)
      .collection("agents");

    const agentsSnapshot = await agentsRef.get();

    const agents = [];
    agentsSnapshot.forEach((doc) => {
      agents.push({
        agent_id: doc.id,
        ...doc.data(),
      });
    });

    res.json({
      success: true,
      agents,
    });
  } catch (error) {
    console.error("Error listing agents:", error);
    res.status(500).json({
      success: false,
      error: "Failed to list agents",
    });
  }
});

// Create knowledge base endpoint
app.post("/api/create-knowledge-base", async (req, res) => {
  try {
    const {
      user_id,
      workspace_id,
      knowledge_base_name,
      document_urls,
      type,
      text_content,
    } = req.body;

    if (!user_id || !workspace_id || !knowledge_base_name) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    let knowledgeBaseParams = {
      knowledge_base_name,
    };

    // Create temp directory for file downloads
    const tempDir = path.join(os.tmpdir(), "kb-files");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // Handle different types of content
    switch (type) {
      case "webpages":
        if (!document_urls?.length) {
          return res.status(400).json({
            success: false,
            error: "No URLs provided for webpage type",
          });
        }
        knowledgeBaseParams.knowledge_base_urls = document_urls;
        break;

      case "files":
        if (!document_urls?.length) {
          return res.status(400).json({
            success: false,
            error: "No file URLs provided",
          });
        }

        try {
          // Download files from Firebase Storage URLs and create read streams
          const fileStreams = await Promise.all(
            document_urls.map(async (url) => {
              const tempFilePath = path.join(tempDir, `file-${Date.now()}`);

              // Download file from Firebase Storage URL
              await new Promise((resolve, reject) => {
                https
                  .get(url, (response) => {
                    const fileStream = fs.createWriteStream(tempFilePath);
                    response.pipe(fileStream);
                    fileStream.on("finish", () => {
                      fileStream.close();
                      resolve();
                    });
                  })
                  .on("error", reject);
              });

              // Create read stream from downloaded file
              return fs.createReadStream(tempFilePath);
            }),
          );

          knowledgeBaseParams.knowledge_base_files = fileStreams;
        } catch (error) {
          console.error("Error processing files:", error);
          throw new Error("Failed to process files");
        }
        break;

      case "text":
        if (!text_content) {
          return res.status(400).json({
            success: false,
            error: "No text content provided",
          });
        }

        knowledgeBaseParams.knowledge_base_texts = [
          {
            text: text_content,
            title: `Manual Entry ${new Date().toISOString()}`,
          },
        ];
        break;

      default:
        return res.status(400).json({
          success: false,
          error: "Invalid content type",
        });
    }

    // Create knowledge base in Retell
    const knowledgeBase =
      await client.knowledgeBase.create(knowledgeBaseParams);

    // Clean up temp files
    if (type === "files") {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    // Save to Firestore
    const kbRef = db
      .collection("users")
      .doc(user_id)
      .collection("workspaces")
      .doc(workspace_id)
      .collection("knowledge_bases")
      .doc(knowledgeBase.knowledge_base_id);

    await kbRef.set({
      ...knowledgeBase,
      type,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      created_by: user_id,
    });

    res.json({
      success: true,
      knowledge_base: knowledgeBase,
    });
  } catch (error) {
    console.error("Error creating knowledge base:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create knowledge base",
    });
  }
});

// Resync knowledge base endpoint
app.post("/api/resync-knowledge-base/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await client.knowledgeBase.refresh(id);

    res.json({
      success: true,
      message: "Knowledge base refresh initiated",
    });
  } catch (error) {
    console.error("Error resyncing knowledge base:", error);
    res.status(500).json({
      success: false,
      error: "Failed to resync knowledge base",
    });
  }
});

// Delete knowledge base endpoint
app.delete("/api/delete-knowledge-base/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await client.knowledgeBase.delete(id);

    res.json({
      success: true,
      message: "Knowledge base deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting knowledge base:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete knowledge base",
    });
  }
});

// Create agent endpoint
app.post("/api/create-agent", async (req, res) => {
  try {
    const { user_id, workspace_id, llm_data, agent_data } = req.body;

    if (!user_id || !workspace_id || !llm_data || !agent_data) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Create LLM
    const llmResponse = await client.llm.create();
    const llm_id = llmResponse.llm_id;

    // Create Agent with LLM
    const agentResponse = await client.agent.create({
      response_engine: { llm_id, type: "retell-llm" },
      voice_id: "11labs-Adrian", // Using the specified voice
    });
    const agent_id = agentResponse.agent_id;

    // Save to Firestore
    const agentRef = db
      .collection("users")
      .doc(user_id)
      .collection("workspaces")
      .doc(workspace_id)
      .collection("agents")
      .doc(agent_id);

    await agentRef.set({
      llm_id,
      agent_id,
      ...agent_data,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      success: true,
      agent_id,
      llm_id,
    });
  } catch (error) {
    console.error("Error creating agent:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create agent",
    });
  }
});

// Get agent endpoint
app.get("/api/get-agent", async (req, res) => {
  try {
    const { agent_id } = req.query;

    if (!agent_id) {
      return res.status(400).json({
        success: false,
        error: "Agent ID is required",
      });
    }

    // Get agent details from Retell
    const agentResponse = await client.agent.retrieve(agent_id);
    const llm_id = agentResponse.response_engine.llm_id;

    // Get LLM details from Retell
    const llmResponse = await client.llm.retrieve(llm_id);

    // Combine the data
    const agentData = {
      ...agentResponse,
      llm_data: llmResponse,
    };

    res.json({
      success: true,
      agent: agentData,
    });
  } catch (error) {
    console.error("Error retrieving agent:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve agent",
    });
  }
});

// Start web call endpoint
app.post("/api/start-web-call", async (req, res) => {
  try {
    const { agent_id } = req.body;

    if (!agent_id) {
      return res.status(400).json({
        success: false,
        error: "Agent ID is required",
      });
    }

    // Create web call using Retell client
    const webCallResponse = await client.call.createWebCall({ agent_id });

    res.json({
      success: true,
      accessToken: webCallResponse.access_token,
    });
  } catch (error) {
    console.error("Error starting web call:", error);
    res.status(500).json({
      success: false,
      error: "Failed to start web call",
    });
  }
});

// Update LLM endpoint
app.post("/api/update-llm", async (req, res) => {
  try {
    const { user_id, workspace_id, llm_data } = req.body;

    console.log(llm_data);

    if (!user_id || !workspace_id || !llm_data || !llm_data.llm_id) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Update LLM in Retell
    const response = await client.llm.update(llm_data.llm_id, {
      general_prompt: llm_data.general_prompt,
      general_tools: llm_data.general_tools,
      begin_message: llm_data.begin_message, // Added begin_message here
      knowledge_base_ids: llm_data.knowledge_base_ids,
    });

    console.log(response);

    // Update in Firestore
    const llmRef = db
      .collection("users")
      .doc(user_id)
      .collection("workspaces")
      .doc(workspace_id)
      .collection("llms")
      .doc(llm_data.llm_id);

    await llmRef.set(
      {
        ...llm_data,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    res.json({
      success: true,
      message: "LLM updated successfully",
    });
  } catch (error) {
    console.error("Error updating LLM:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update LLM",
    });
  }
});

// Update agent endpoint
app.post("/api/update-agent", async (req, res) => {
  try {
    const { user_id, workspace_id, agent_data } = req.body;

    if (!user_id || !workspace_id || !agent_data || !agent_data.agent_id) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Update agent in Retell
    const updateData = {
      voice_id: agent_data.voice_id,
      language: agent_data.language,
      // Removed begin_message from here since it's now handled in LLM update
      enable_voicemail_detection: agent_data.enable_voicemail_detection,
      end_call_after_silence_ms: agent_data.end_call_after_silence_ms,
      max_call_duration_ms: agent_data.max_call_duration_ms,
      begin_message_delay_ms: agent_data.begin_message_delay_ms,
      ambient_sound: agent_data.ambient_sound,
      responsiveness: agent_data.responsiveness,
      interruption_sensitivity: agent_data.interruption_sensitivity,
      enable_backchannel: agent_data.enable_backchannel,
      backchannel_words: agent_data.backchannel_words,
      pronunciation_dictionary: agent_data.pronunciation_dictionary,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );

    await client.agent.update(agent_data.agent_id, updateData);

    // Update in Firestore
    const agentRef = db
      .collection("users")
      .doc(user_id)
      .collection("workspaces")
      .doc(workspace_id)
      .collection("agents")
      .doc(agent_data.agent_id);

    await agentRef.set(
      {
        ...agent_data,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    res.json({
      success: true,
      message: "Agent updated successfully",
    });
  } catch (error) {
    console.error("Error updating agent:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update agent",
    });
  }
});

// List phone numbers endpoint
app.get("/api/list-phone-numbers", async (req, res) => {
  try {
    const phoneNumbers = await client.phoneNumber.list();
    res.json(phoneNumbers);
  } catch (error) {
    console.error("Error listing phone numbers:", error);
    res.status(500).json({
      success: false,
      error: "Failed to list phone numbers",
    });
  }
});

// Create phone number endpoint
// app.post("/api/create-phone-number", async (req, res) => {
//   try {
//     const {
//       phone_number,
//       area_code,
//       nickname,
//       inbound_agent_id,
//       outbound_agent_id,
//     } = req.body;

//     if (!phone_number || !area_code) {
//       return res.status(400).json({
//         success: false,
//         error: "Phone number and area code are required",
//       });
//     }

//     const phoneNumberResponse = await client.phoneNumber.create({
//       phone_number,
//       area_code,
//       nickname,
//       inbound_agent_id,
//       outbound_agent_id,
//     });

//     res.json({
//       success: true,
//       phone_number: phoneNumberResponse,
//     });
//   } catch (error) {
//     console.error("Error creating phone number:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to create phone number",
//     });
//   }
// });

// Update phone number endpoint
app.post("/api/update-phone-number", async (req, res) => {
  console.log("update phone number");
  console.log(req.body);
  try {
    const {
      user_id,
      workspace_id,
      phone_number,
      nickname,
      inbound_agent_id,
      outbound_agent_id,
    } = req.body;

    if (!phone_number) {
      return res.status(400).json({
        success: false,
        error: "Phone number is required",
      });
    }

    const updateData = {
      nickname,
      inbound_agent_id,
      outbound_agent_id,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );

    const phoneNumberResponse = await client.phoneNumber.update(
      phone_number,
      updateData,
    );

    const phoneNumberRef = db
      .collection("users")
      .doc(user_id)
      .collection("workspaces")
      .doc(workspace_id)
      .collection("phone_numbers")
      .doc(phoneNumberResponse.phone_number);

    await phoneNumberRef.set({
      ...phoneNumberResponse,
    });

    res.json({
      success: true,
      message: "Phone number updated successfully",
    });
  } catch (error) {
    console.error("Error updating phone number:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update phone number",
    });
  }
});

// Delete phone number endpoint
app.delete("/api/delete-phone-number/:phone_number", async (req, res) => {
  try {
    const { phone_number } = req.params;

    await client.phoneNumber.delete(phone_number);

    res.json({
      success: true,
      message: "Phone number deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting phone number:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete phone number",
    });
  }
});

// Make outbound call endpoint
app.post("/api/make-outbound-call", async (req, res) => {
  try {
    const { from_phone_number, to_phone_number } = req.body;

    if (!from_phone_number || !to_phone_number) {
      return res.status(400).json({
        success: false,
        error: "Phone number is required",
      });
    }

    const callResponse = await client.call.createPhoneCall({
      from_number: from_phone_number,
      to_number: to_phone_number,
    });

    res.json({
      success: true,
      call: callResponse,
    });
  } catch (error) {
    console.error("Error making outbound call:", error);
    res.status(500).json({
      success: false,
      error: "Failed to make outbound call",
    });
  }
});

app.post("/api/create-phone-number", async (req, res) => {
  try {
    const { user_id, workspace_id, area_code } = req.body;

    if (!user_id || !workspace_id || !area_code) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Create phone number in Retell
    const phoneNumberResponse = await client.phoneNumber.create({
      area_code,
    });

    console.log(phoneNumberResponse);

    // Save to Firestore
    const phoneNumberRef = db
      .collection("users")
      .doc(user_id)
      .collection("workspaces")
      .doc(workspace_id)
      .collection("phone_numbers")
      .doc(phoneNumberResponse.phone_number);

    await phoneNumberRef.set({
      ...phoneNumberResponse,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      success: true,
      phone_number: phoneNumberResponse,
    });
  } catch (error) {
    console.error("Error creating phone number:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create phone number",
    });
  }
});

app.post("/api/webhook", async (req, res) => {
  console.log("Webhook triggered");
  console.log(req.body);

  // Step 1: Check if the event is 'call_analyzed'
  if (req.body.event !== "call_analyzed") {
    console.log(`Event '${req.body.event}' is not 'call_analyzed'. Ignoring.`);
    return res.sendStatus(200);
  }

  const call = req.body.call;
  const agentId = call.agent_id;
  const callId = call.call_id;

  if (!agentId || !callId) {
    console.error("Missing agent_id or call_id in the request body.");
    return res.status(400).send("Bad Request: Missing agent_id or call_id.");
  }

  try {
    // Step 2: Use a Collection Group Query to find the agent document
    console.log(agentId);
    const agentQuerySnapshot = await db
      .collectionGroup("agents")
      .where("agent_id", "==", agentId)
      .orderBy("created_at", "desc")
      .limit(1) // Assuming agent_id is unique
      .get();

    if (agentQuerySnapshot.empty) {
      console.warn(`Agent ID '${agentId}' not found in Firestore.`);
      return res.sendStatus(200); // Optionally, you might want to respond differently
    }

    // Assuming agent_id is unique and only one document is found
    const agentDoc = agentQuerySnapshot.docs[0];
    const agentRef = agentDoc.ref;

    // Navigate up the document hierarchy to get workspace and user
    const workspaceRef = agentRef.parent.parent;
    if (!workspaceRef) {
      console.error("Workspace reference not found for the agent.");
      return res
        .status(500)
        .send("Internal Server Error: Workspace not found.");
    }

    const userRef = workspaceRef.parent.parent;
    if (!userRef) {
      console.error("User reference not found for the workspace.");
      return res.status(500).send("Internal Server Error: User not found.");
    }

    const userId = userRef.id;
    const workspaceId = workspaceRef.id;

    console.log(
      `Agent ID '${agentId}' belongs to User ID '${userId}' and Workspace ID '${workspaceId}'.`,
    );

    // Step 3: Create a new document in 'call_history' sub-collection
    console.log(userId);
    console.log(workspaceId);
    console.log(callId);
    const callHistoryRef = db
      .collection("users")
      .doc(userId)
      .collection("workspaces")
      .doc(workspaceId)
      .collection("call_history")
      .doc(callId);

    // Set the entire call data. Adjust as needed (e.g., exclude sensitive info)

    console.log(call);
    await callHistoryRef.set(call);

    console.log(`Call ID '${callId}' has been saved to 'call_history'.`);

    // Respond with 200 OK
    res.sendStatus(200);
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Add the webhook routes
app.use("/webhook", webhookRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
