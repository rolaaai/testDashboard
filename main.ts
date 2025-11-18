// DOM Elements
const form = document.getElementById("meeting-form") as HTMLFormElement;
const urlInput = document.getElementById("url") as HTMLInputElement;
const activeMeetingsContainer = document.getElementById("active-meetings") as HTMLDivElement;
const noMeetingsElem = document.getElementById("no-meetings") as HTMLParagraphElement;
const statusElem = document.getElementById("status") as HTMLDivElement;

// API Configuration
const API_BASE_URL = "/api";

// Store active meetings - we'll manage this client-side
let activeMeetings: Array<{
  meetingId: string;
  containerName: string;
  url: string;
  status: string;
  createdAt: string;
}> = [];

// Initialize the application
function init() {
  setupEventListeners();
  // No need to fetch active meetings on init since we don't have that endpoint
}

// Set up event listeners
function setupEventListeners() {
  // Form submission
  form.addEventListener("submit", handleFormSubmit);
}

// Handle form submission
async function handleFormSubmit(e: Event) {
  e.preventDefault();
  
  const url = urlInput.value.trim();
  if (!url) {
    showStatus("Please enter a valid URL", "error");
    return;
  }

  showStatus("Joining meeting...", "info");
  
  try {
   
    const response = await fetch(`${API_BASE_URL}/submit_meeting_link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        meet_url: url
      }),
    });

    console.log("Response status:", response.status);
    const result = await response.json();
    console.log("Response data:", result); // Debug log

    if (!response.ok) {
      throw new Error(await response.text());
    }

    // Update this part to match the backend response structure
    if (result.meeting_id) {  // Changed from result.meetingId to result.meeting_id
      activeMeetings.push({
        meetingId: result.meeting_id,  // Changed from result.meetingId to result.meeting_id
        containerName: result.containerName || `meeting-${Date.now()}`,
        url: url,
        status: 'active',
        createdAt: new Date().toISOString()
      });
      renderActiveMeetings();
      showStatus("Meeting joined successfully", "success");
      urlInput.value = "";
    } else {
      console.error("Unexpected response format:", result);
      throw new Error('Invalid response format from server');
    }
    
  } catch (error) {
    console.error("Error joining meeting:", error);
    showStatus(
      error instanceof Error ? error.message : "Failed to join meeting",
      "error"
    );
  }
}

// Render active meetings in the UI
function renderActiveMeetings() {
  if (!activeMeetings || activeMeetings.length === 0) {
    noMeetingsElem.style.display = "block";
    activeMeetingsContainer.innerHTML = "";
    activeMeetingsContainer.appendChild(noMeetingsElem);
    return;
  }

  noMeetingsElem.style.display = "none";
  activeMeetingsContainer.innerHTML = "";

  activeMeetings.forEach((meeting) => {
    const meetingElem = document.createElement("div");
    meetingElem.className = "meeting-item";
    
    const meetingDate = new Date(meeting.createdAt).toLocaleString();
    
    meetingElem.innerHTML = `
      <div class="meeting-info">
        <span class="meeting-url">${meeting.url}</span>
        <span class="meeting-status">Started: ${meetingDate} • Status: ${meeting.status}</span>
      </div>
      <button 
        class="force-stop-btn" 
        data-meeting-id="${meeting.meetingId}"
        ${meeting.status === "stopped" || meeting.status === "ended" ? "disabled" : ""}
      >
        ${meeting.status === "stopping" ? "Stopping..." : "Force Stop"}
        ${meeting.status === "stopping" ? '<span class="loading"></span>' : ''}
      </button>
    `;

    // Add click handler to the force stop button
    const stopBtn = meetingElem.querySelector(".force-stop-btn");
    if (stopBtn) {
      stopBtn.addEventListener("click", () => handleStopMeeting(meeting.containerName,meeting.meetingId));
    }

    activeMeetingsContainer.appendChild(meetingElem);
  });
}

// Handle stop meeting request
// Handle stop meeting request
async function handleStopMeeting(containerName: string, meetingId: string) {
  const button = document.querySelector(
    `.force-stop-btn[data-meeting-id="${meetingId}"]`
  ) as HTMLButtonElement;

  if (!button || button.disabled) return;

  button.disabled = true;
  button.innerHTML = 'Stopping...<span class="loading"></span>';

  try {
    const response = await fetch(`${API_BASE_URL}/meeting/stop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        meetingId,
        stopAfterDuration: 20,
        containerName
      }),
    });

    const result = await response.json();
    console.log("Stop meeting response:", result); // Debug log

    if (!response.ok) {
      throw new Error(result.message || 'Failed to stop meeting');
    }

    // Update the meeting status in our client-side list
    const meetingIndex = activeMeetings.findIndex(m => m.meetingId === meetingId);
    if (meetingIndex !== -1) {
      activeMeetings[meetingIndex].status = 'stopped';
      renderActiveMeetings();
    }
    
    showStatus(result.message || 'Meeting stopped successfully', "success");
  } catch (error) {
    console.error("Error stopping meeting:", error);
    showStatus(
      error instanceof Error ? error.message : "Failed to stop meeting",
      "error"
    );
    // Re-enable the button on error
    if (button) {
      button.disabled = false;
      button.textContent = "Force Stop";
    }
  }
}

// Show status message
function showStatus(message: string, type: "success" | "error" | "info" = "info") {
  statusElem.textContent = message;
  statusElem.className = "status-message";
  
  if (type === "success") {
    statusElem.classList.add("success");
  } else if (type === "error") {
    statusElem.classList.add("error");
  }
  
  // Auto-hide success messages after 5 seconds
  if (type === "success") {
    setTimeout(() => {
      statusElem.textContent = "";
      statusElem.className = "status-message";
    }, 5000);
  }
}

// Initialize the application when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", init);