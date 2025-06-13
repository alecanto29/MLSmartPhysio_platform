express = require("express");
const router = express.Router();

const inertialDataController = require("../controller/inertialDataController");

//definizione delle rotte
router.get("/", inertialDataController.getData);
router.get("/sessionId", inertialDataController.getAllInertialDataBySession);
router.get("/export/csv/:sessionID", inertialDataController.InertialExportAsCSV);

router.get("/:id", inertialDataController.getDataByChannel);

router.delete("/", inertialDataController.deleteAllInertialData);
router.delete("/:sessionId", inertialDataController.deleteAllInertialDataBySession);
module.exports = router;