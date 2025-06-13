const express = require("express");
const router = express.Router();

const sEMGdataController = require("../controller/sEMGdataController");


router.get("/", sEMGdataController.getData);
router.get("/session/:sessionId", sEMGdataController.getAllsEMGdataBySession);
router.get("/channel/:id", sEMGdataController.getDataByChannel);


router.delete("/", sEMGdataController.deleteAllsEMGdata);
router.delete("/:sessionId", sEMGdataController.deleteAllsEMGdataBySession);

router.get("/export/csv/:sessionID", sEMGdataController.sEMGexportAsCSV);

module.exports = router;
