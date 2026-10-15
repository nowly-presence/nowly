import type { Handler } from "@/background/router/router"
import {
  deleteCustomActivity,
  getCustomImageData,
  saveCustomActivity,
  setActiveCustomActivity,
  uploadCustomImage,
} from "@/background/managers/custom-activity-manager"
import { getCustomActivities } from "@/background/storage/custom-activities.store"

export const handleGetCustomActivities: Handler<"GET_CUSTOM_ACTIVITIES"> = () => getCustomActivities()

export const handleSaveCustomActivity: Handler<"SAVE_CUSTOM_ACTIVITY"> = ({ draft }) => saveCustomActivity(draft)

export const handleDeleteCustomActivity: Handler<"DELETE_CUSTOM_ACTIVITY"> = ({ id }) => deleteCustomActivity(id)

export const handleSetCustomActivityActive: Handler<"SET_CUSTOM_ACTIVITY_ACTIVE"> = ({ id }) => setActiveCustomActivity(id)

export const handleUploadCustomImage: Handler<"UPLOAD_CUSTOM_IMAGE"> = ({ dataUrl }) => uploadCustomImage(dataUrl)

export const handleGetCustomImages: Handler<"GET_CUSTOM_IMAGES"> = ({ hashes }) => getCustomImageData(hashes)
