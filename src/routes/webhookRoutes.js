const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const axios = require("axios");
const { Client } = require("@googlemaps/google-maps-services-js");
const serviceAccount = require("./../../firebase-config.json");

// -------------------- FIREBASE INIT --------------------
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "wannes-whitelabelled.appspot.com",
  });
}

const db = admin.firestore();

// -------------------- MAPS CLIENT --------------------
const mapsClient = new Client({});

// -------------------- GHL CONFIG --------------------
const GHL_BASE_URL = "https://services.leadconnectorhq.com";
const GHL_TOKEN = "pit-13b404e5-9807-411f-bb96-380723b24d32";

/**
 * Computes driving distance between two zip codes using Google Maps Distance Matrix.
 */
async function getDistance(origin, destination) {
  try {
    const response = await mapsClient.distancematrix({
      params: {
        origins: [origin],
        destinations: [destination],
        mode: "driving",
        key: "AIzaSyBqUWrEo5PU5hfIaWespZ4QubfnFzxr07A",
      },
    });

    if (
      response.data.status === "OK" &&
      response.data.rows[0].elements[0].status === "OK"
    ) {
      // Returns distance in meters
      return response.data.rows[0].elements[0].distance.value;
    }
    return null;
  } catch (error) {
    console.error("Error getting distance:", error);
    return null;
  }
}

/**
 * Fetches free slots from GoHighLevel for a given calendarId and date (YYYY-MM-DD).
 * Returns an array of slot strings like "2025-03-10T14:00:00+05:30".
 */
async function getAvailableSlots(calendarId, dateOnly) {
  try {
    // Convert dateOnly (e.g. "2025-03-10") to 00:00 UTC
    const startDate = new Date(`${dateOnly}T00:00:00.000Z`);
    // End date is 24h after start
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

    const response = await axios.get(
      `${GHL_BASE_URL}/calendars/${calendarId}/free-slots`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${GHL_TOKEN}`,
          Version: "2021-04-15",
        },
        params: {
          startDate: startDate.getTime(), // in milliseconds
          endDate: endDate.getTime(),
        },
      },
    );

    const data = response.data || {};
    // GHL returns date-based keys like "2025-03-10": { slots: [...] }
    const dayData = data[dateOnly] || {};
    console.log(dayData.slots);
    return dayData.slots || [];
  } catch (error) {
    console.error("Error checking calendar availability:", error);
    return [];
  }
}

/**
 * Creates an appointment in GHL using a full ISO string (time with offset).
 *
 * @param {string} calendarId - The GHL calendar ID
 * @param {string} locationId - The GHL location ID
 * @param {string} isoTime    - Full ISO datetime (e.g., "2025-03-10T14:00:00+05:30")
 */
async function createAppointment(calendarId, locationId, isoTime) {
  try {
    // Convert string to JS Date (preserves offset)
    const startTime = new Date(isoTime);
    // We'll assume a 1-hour appointment
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

    const appointmentData = {
      calendarId,
      locationId,
      contactId: "JER1JGMvTHY6Vd21gbZc", // Hardcoded contact ID
      startTime: startTime.toISOString(), // in UTC
      endTime: endTime.toISOString(),
    };

    const response = await axios.post(
      `${GHL_BASE_URL}/calendars/events/appointments`,
      appointmentData,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${GHL_TOKEN}`,
          "Content-Type": "application/json",
          Version: "2021-04-15",
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error creating appointment:", error);
    return null;
  }
}

/**
 * Helper: checks if 'slots' contains an ISO time matching 'desiredTime' in UTC
 */
function hasMatchingSlot(slots, desiredTime) {
  const desiredUtc = new Date(desiredTime).getTime();
  return slots.some((slotStr) => {
    const slotUtc = new Date(slotStr).getTime();
    return slotUtc === desiredUtc;
  });
}

// -----------------------------------------------------
//                 ROUTING WEBHOOK
// -----------------------------------------------------
router.post("/routing/:user_id/:workspace_id", async (req, res) => {
  try {
    /**
     * We expect:
     * {
     *   "time": "2025-03-10T14:00:00+04:30", // Full ISO
     *   "zipcode": "10001"
     * }
     * We'll check if agent is free at that 'time'
     * PLUS 30 minutes before that 'time'.
     */
    const { time, zipcode } = req.body;
    const { user_id, workspace_id } = req.params;

    if (!time || !zipcode) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: time or zipcode",
      });
    }

    // local date "YYYY-MM-DD" from user’s requested time
    const dateOnly = time.slice(0, 10);

    // 30 min before
    const userTimeMs = new Date(time).getTime();
    const travelTimeMs = userTimeMs - 30 * 60 * 1000;
    // convert that to ISO
    const travelTimeIso = new Date(travelTimeMs).toISOString();

    // NOTE: We assume travelTime is still on the same date (no midnight crossing)

    // Fetch user data
    const userDoc = await db
      .collection("users")
      .doc(user_id)
      .collection("workspaces")
      .doc(workspace_id)
      .get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "User or workspace not found",
      });
    }

    const userData = userDoc.data();
    const routingAgents = userData.routing_agents || [];

    if (routingAgents.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No routing agents found",
      });
    }

    // We'll gather all agents that have a matching time plus the travelTime
    const availableAgents = [];

    // 1) fetch free slots for that date
    //  (for each agent, we do the same date, no separate call for the day before)
    for (const agent of routingAgents) {
      const slots = await getAvailableSlots(agent.calendar_id, dateOnly);

      const mainSlot = hasMatchingSlot(slots, time);
      const travelSlot = hasMatchingSlot(slots, travelTimeIso);

      console.log(mainSlot);
      console.log(travelSlot);

      if (mainSlot && travelSlot) {
        // agent is free 30 min prior + requested time
        const distance = await getDistance(zipcode, agent.zipcode);
        if (distance !== null) {
          availableAgents.push({ ...agent, distance });
        }
      }
    }

    if (availableAgents.length === 0) {
      return res.status(404).json({
        success: false,
        error:
          "No agents available at the specified time (including 30-min buffer)",
      });
    }

    // Sort by distance
    availableAgents.sort((a, b) => a.distance - b.distance);

    // Book with the nearest agent
    const selectedAgent = availableAgents[0];
    const appointment = await createAppointment(
      selectedAgent.calendar_id,
      userData.location_id,
      time,
    );

    if (!appointment) {
      return res.status(500).json({
        success: false,
        error: "Failed to create appointment",
      });
    }

    // Return success
    res.json({
      success: true,
      appointment: {
        agent: {
          address: selectedAgent.address,
          distance: selectedAgent.distance,
        },
        appointmentDetails: appointment,
      },
    });
  } catch (error) {
    console.error("Error in routing webhook:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

module.exports = router;
