from copy import deepcopy

import pytest
from fastapi.testclient import TestClient

import src.app as app_module


ORIGINAL_ACTIVITIES = deepcopy(app_module.activities)


@pytest.fixture
def api_client(monkeypatch):
    monkeypatch.setattr(app_module, "activities", deepcopy(ORIGINAL_ACTIVITIES))
    return TestClient(app_module.app)


def test_get_activities_returns_seeded_activity_data(api_client):
    # Arrange
    activity_name = "Chess Club"

    # Act
    response = api_client.get("/activities")

    # Assert
    assert response.status_code == 200
    activity_data = response.json()
    assert activity_name in activity_data
    assert activity_data[activity_name]["participants"] == [
        "michael@mergington.edu",
        "daniel@mergington.edu",
    ]


def test_signup_adds_participant(api_client):
    # Arrange
    activity_name = "Basketball Team"
    participant_email = "student@mergington.edu"

    # Act
    response = api_client.post(
        f"/activities/{activity_name}/signup",
        params={"email": participant_email},
    )

    # Assert
    assert response.status_code == 200
    assert response.json() == {
        "message": f"Signed up {participant_email} for {activity_name}"
    }
    participants = api_client.get("/activities").json()[activity_name]["participants"]
    assert participants == [participant_email]


def test_signup_rejects_duplicate_participant(api_client):
    # Arrange
    activity_name = "Chess Club"
    participant_email = "michael@mergington.edu"
    original_participants = api_client.get("/activities").json()[activity_name]["participants"]

    # Act
    response = api_client.post(
        f"/activities/{activity_name}/signup",
        params={"email": participant_email},
    )

    # Assert
    assert response.status_code == 400
    assert response.json()["detail"] == "Student is already signed up for this activity"
    participants = api_client.get("/activities").json()[activity_name]["participants"]
    assert participants == original_participants


def test_signup_rejects_unknown_activity(api_client):
    # Arrange
    activity_name = "Unknown Club"
    participant_email = "student@mergington.edu"

    # Act
    response = api_client.post(
        f"/activities/{activity_name}/signup",
        params={"email": participant_email},
    )

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_unregister_removes_participant(api_client):
    # Arrange
    activity_name = "Chess Club"
    participant_email = "michael@mergington.edu"

    # Act
    response = api_client.delete(
        f"/activities/{activity_name}/signup",
        params={"email": participant_email},
    )

    # Assert
    assert response.status_code == 200
    assert response.json() == {
        "message": f"Unregistered {participant_email} from {activity_name}"
    }
    participants = api_client.get("/activities").json()[activity_name]["participants"]
    assert participant_email not in participants


def test_unregister_rejects_nonparticipant(api_client):
    # Arrange
    activity_name = "Basketball Team"
    participant_email = "student@mergington.edu"

    # Act
    response = api_client.delete(
        f"/activities/{activity_name}/signup",
        params={"email": participant_email},
    )

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Student is not signed up for this activity"
    participants = api_client.get("/activities").json()[activity_name]["participants"]
    assert participants == []


def test_unregister_rejects_unknown_activity(api_client):
    # Arrange
    activity_name = "Unknown Club"
    participant_email = "student@mergington.edu"

    # Act
    response = api_client.delete(
        f"/activities/{activity_name}/signup",
        params={"email": participant_email},
    )

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"