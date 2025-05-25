const sEMGService = require("../../src/services/sEMGdataService");
const sEMGdata = require("../../src/models/sEMGdataModel");

jest.mock("../../src/models/sEMGdataModel");

describe("sEMGdataService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("getAllsEMGdata restituisce i dati", async () => {
        const mockData = [{ data: [1,2,3,4,5,6,7,8] }];
        sEMGdata.find.mockResolvedValue(mockData);

        const result = await sEMGService.getAllsEMGdata();
        expect(result).toEqual(mockData);
    });

    test("getDataByChannel restituisce solo un canale specifico", async () => {
        sEMGdata.find.mockResolvedValue([
            { data: [10, 20, 30, 40, 50, 60, 70, 80] },
            { data: [11, 21, 31, 41, 51, 61, 71, 81] }
        ]);

        const result = await sEMGService.getDataByChannel(1);
        expect(result).toEqual([20, 21]);
    });

    test("getDataByChannel con indice non valido lancia errore", async () => {
        await expect(sEMGService.getDataByChannel(-1)).rejects.toThrow();
        await expect(sEMGService.getDataByChannel(99)).rejects.toThrow();
    });

    test("deleteAllsEMGdata cancella tutti i dati", async () => {
        sEMGdata.deleteMany.mockResolvedValue({ deletedCount: 42 });
        const result = await sEMGService.deleteAllsEMGdata();
        expect(result).toEqual({ message: "Dati cancellati correttamente" });
    });

    test("savesEMGdata salva solo array validi", async () => {
        const input = [
            [1,2,3,4,5,6,7,8],       // valido
            [9,10,11,12],            // non valido
            "non_array",             // non valido
            [1,2,3,4,5,6,7,"x"],     // non valido
        ];

        await sEMGService.savesEMGdata(input);

        expect(sEMGdata.insertMany).toHaveBeenCalledWith([
            { data: [1,2,3,4,5,6,7,8] }
        ]);
    });

    test("sEMGasCSVexport restituisce CSV corretto", async () => {
        sEMGdata.find.mockReturnValue({
            lean: () => [
                { data: [1, 2, 3] },
                { data: [4, 5, 6] }
            ]
        });

        const csv = await sEMGService.sEMGasCSVexport();

        expect(csv).toContain('"ch1","ch2","ch3"'); // 👈 con doppi apici
        expect(csv).toContain('1,2,3');              // o usa "1","2","3" se vuoi coerenza assoluta
        expect(csv).toContain('4,5,6');
    });
});
