const express = require("express");
const router = express.Router();

const sEMGdataController = require("../controller/sEMGdataController");


router.get("/", sEMGdataController.getData);
router.get("/session/:sessionId", sEMGdataController.getAllsEMGdataBySession);
router.get("/channel/:id", sEMGdataController.getDataByChannel);


router.delete("/", sEMGdataController.deleteAllsEMGdata);
router.delete("/session/:sessionId", sEMGdataController.deleteAllsEMGdataBySession);

router.get("/export/csv", sEMGdataController.sEMGexportAsCSV);

module.exports = router;
