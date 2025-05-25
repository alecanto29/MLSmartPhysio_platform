express = require("express");
const router = express.Router();

const inertialDataController = require("../controller/inertialDataController");

//definizione delle rotte
router.get("/", inertialDataController.getData);

router.get("/export/csv", inertialDataController.InertialExportAsCSV);

router.get("/:id", inertialDataController.getDataByChannel);

router.delete("/", inertialDataController.deleteAllInertialData);

module.exports = router;