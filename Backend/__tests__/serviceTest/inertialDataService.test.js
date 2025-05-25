const inertialDataService = require('../../src/services/inertialDataService');
const inertialData = require('../../src/models/inertialDataModel');

jest.mock('../../src/models/inertialDataModel'); // mocka il model Mongoose

describe('inertialDataService', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('getAllInertialData() - ritorna dati', async () => {
        const mockData = [{ data: [1, 2, 3, 4, 5, 6, 7, 8] }];
        inertialData.find.mockResolvedValue(mockData);

        const result = await inertialDataService.getAllInertialData();
        expect(result).toEqual(mockData);
    });

    test('getDataByChannel() - ritorna valori per canale', async () => {
        inertialData.find.mockResolvedValue([
            { data: [10, 20, 30, 40, 50, 60, 70, 80] },
            { data: [11, 21, 31, 41, 51, 61, 71, 81] },
        ]);

        const result = await inertialDataService.getDataByChannel(1);
        expect(result).toEqual([20, 21]);
    });

    test('getDataByChannel() - canale non valido', async () => {
        await expect(inertialDataService.getDataByChannel(-1)).rejects.toThrow();
        await expect(inertialDataService.getDataByChannel(10)).rejects.toThrow();
    });

    test('deleteAllInertialData() - cancella tutto', async () => {
        inertialData.deleteMany.mockResolvedValue({ deletedCount: 5 });
        const result = await inertialDataService.deleteAllInertialData();
        expect(result).toEqual({ message: "Dati cancellati correttamente" });
    });

    test('saveInertialData() - salva solo array validi', async () => {
        const data = [
            [1, 2, 3, 4, 5, 6, 7, 8, 9],
            [10, 11, 12], // non valida
        ];
        inertialData.insertMany.mockResolvedValue();
        await inertialDataService.saveInertialData(data);
        expect(inertialData.insertMany).toHaveBeenCalledWith([
            { data: [1, 2, 3, 4, 5, 6, 7, 8, 9] }
        ]);
    });

    test('InertialasCSVexport() - esporta correttamente CSV', async () => {
        const mockData = [
            { data: [1.123, 2.456, 3.789] },
            { data: [4.987, 5.654, 6.321] }
        ];

        inertialData.find.mockReturnValue({
            lean: () => mockData
        });

        const csv = await inertialDataService.InertialasCSVexport();

        expect(csv).toContain('"ch1","ch2","ch3"');
        expect(csv).toContain('"1.1","2.5","3.8"');
    });


});
