document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.querySelectorAll("option:not(:first-child)").forEach((option) => option.remove());

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="availability"><strong>Availability:</strong> <span>${spotsLeft} spots left</span></p>
          <div class="participants-section">
            <h5>Participants (${details.participants.length})</h5>
            <ul class="participant-list"></ul>
          </div>
        `;

        const participantList = activityCard.querySelector(".participant-list");
        const participantHeading = activityCard.querySelector(".participants-section h5");
        const availability = activityCard.querySelector(".availability span");
        if (details.participants.length === 0) {
          const emptyItem = document.createElement("li");
          emptyItem.className = "empty";
          emptyItem.textContent = "No participants yet";
          participantList.appendChild(emptyItem);
        } else {
          details.participants.forEach((participant) => {
            const participantItem = document.createElement("li");
            participantItem.className = "participant-item";

            const participantEmail = document.createElement("span");
            participantEmail.className = "participant-email";
            participantEmail.textContent = participant;

            const removeButton = document.createElement("button");
            removeButton.className = "remove-participant";
            removeButton.type = "button";
            removeButton.textContent = "×";
            removeButton.title = "Unregister participant";
            removeButton.setAttribute("aria-label", `Unregister ${participant} from ${name}`);
            removeButton.addEventListener("click", async () => {
              removeButton.disabled = true;
              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(participant)}`,
                  { method: "DELETE" }
                );
                const result = await response.json();

                if (!response.ok) {
                  throw new Error(result.detail || "Unable to unregister participant");
                }

                details.participants.splice(details.participants.indexOf(participant), 1);
                participantItem.remove();
                participantHeading.textContent = `Participants (${details.participants.length})`;
                availability.textContent = `${details.max_participants - details.participants.length} spots left`;

                if (details.participants.length === 0) {
                  const emptyItem = document.createElement("li");
                  emptyItem.className = "empty";
                  emptyItem.textContent = "No participants yet";
                  participantList.appendChild(emptyItem);
                }

                messageDiv.textContent = result.message;
                messageDiv.className = "success";
                messageDiv.classList.remove("hidden");
                setTimeout(() => messageDiv.classList.add("hidden"), 5000);
              } catch (error) {
                messageDiv.textContent = error.message || "Failed to unregister participant";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
                setTimeout(() => messageDiv.classList.add("hidden"), 5000);
              } finally {
                removeButton.disabled = false;
              }
            });

            participantItem.append(participantEmail, removeButton);
            participantList.appendChild(participantItem);
          });
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        await fetchActivities();
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
