const express = require('express');
const cors = require('cors');
const Retell = require('retell-sdk');
const admin = require('firebase-admin');

const app = express();

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

// Initialize Retell client
const client = new Retell({
  apiKey: 'key_739b6a1ddbcb56a96028bff7089b'
});

// Middleware
app.use(cors());
app.use(express.json());

// Create agent endpoint
app.post('/api/agents', async (req, res) => {
  try {
    const { user_id, workspace_id, llm_data, agent_data } = req.body;

    if (!user_id || !workspace_id || !llm_data || !agent_data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Create LLM
    const llmResponse = await client.llm.create();
    const llm_id = llmResponse.llm_id;

    // Create Agent with LLM
    const agentResponse = await client.agent.create({
      response_engine: { llm_id, type: 'retell-llm' },
      voice_id: '11labs-Adrian', // Using the specified voice
    });
    const agent_id = agentResponse.agent_id;

    // Save to Firestore
    const agentRef = db
      .collection('users')
      .doc(user_id)
      .collection('workspaces')
      .doc(workspace_id)
      .collection('agents')
      .doc(agent_id);

    await agentRef.set({
      llm_id,
      agent_id,
      ...agent_data,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      agent_id,
      llm_id
    });
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create agent'
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});