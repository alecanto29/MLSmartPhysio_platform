const express = require("express");
const router = express.Router();

const sEMGdataController = require("../controller/sEMGdataController");

router.get("/", sEMGdataController.getData);

router.get("/:id", sEMGdataController.getDataByChannel);

router.delete("/", sEMGdataController.deleteAllsEMGdata);

router.get("/export/csv", sEMGdataController.sEMGexportAsCSV);

module.exports = router;
