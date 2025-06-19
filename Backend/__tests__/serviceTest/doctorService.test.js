// __tests__/serviceTest/doctorService.test.js
const mongoose = require('mongoose');
const Doctor = require('../../src/models/Doctor');
const doctorService = require('../../src/services/DoctorServices');

// Mockeremo i metodi del modello
jest.mock('../../src/models/Doctor');

describe("doctorService", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("getAllDoctors returns all doctors", async () => {
        const mockDoctors = [{ name: "Dr. A" }, { name: "Dr. B" }];
        Doctor.find.mockResolvedValue(mockDoctors);

        const result = await doctorService.getAllDoctors();
        expect(result).toEqual(mockDoctors);
        expect(Doctor.find).toHaveBeenCalledTimes(1);
    });

    test("getDoctorById returns a doctor", async () => {
        const mockDoctor = { name: "Dr. C" };
        Doctor.findById.mockResolvedValue(mockDoctor);

        const result = await doctorService.getDoctorById("123");
        expect(result).toEqual(mockDoctor);
        expect(Doctor.findById).toHaveBeenCalledWith("123");
    });

    test("getDoctorByEmail returns a doctor", async () => {
        const mockDoctor = { email: "test@test.com" };
        Doctor.findOne.mockResolvedValue(mockDoctor);

        const result = await doctorService.getDoctorByEmail("test@test.com");
        expect(result).toEqual(mockDoctor);
        expect(Doctor.findOne).toHaveBeenCalledWith({ email: "test@test.com" });
    });

    test("createNewDoctor saves a new doctor", async () => {
        const input = { name: "Dr. D" };
        const savedDoctor = { _id: "mockId", name: "Dr. D" };

        const saveMock = jest.fn().mockResolvedValue(savedDoctor);
        Doctor.mockImplementation(() => ({
            save: saveMock
        }));

        const result = await doctorService.createNewDoctor(input);
        expect(result).toEqual(savedDoctor);
        expect(saveMock).toHaveBeenCalled();
    });

    test("deleteDoctor removes doctor by ID", async () => {
        const mockDoctor = { _id: "abc123", name: "Dr. E" };
        Doctor.findByIdAndDelete.mockResolvedValue(mockDoctor);

        const result = await doctorService.deleteDoctor("abc123");
        expect(result).toEqual(mockDoctor);
        expect(Doctor.findByIdAndDelete).toHaveBeenCalledWith("abc123");
    });
});
