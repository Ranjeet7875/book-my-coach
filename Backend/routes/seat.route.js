const express = require("express");
const router = express.Router();
const SeatModel = require("../models/seat.model");
const authMiddleware = require("../middlewares/auth.middlware");

// Initialize seats if they don't exist
const initializeSeats = async () => {
    const seatsCount = await SeatModel.countDocuments();
    if (seatsCount === 0) {
        const seatPromises = [];
        for (let i = 1; i <= 80; i++) {
            seatPromises.push(
                new SeatModel({
                    seatNumber: i,
                    booked: false,
                    bookedBy: null
                }).save()
            );
        }
        await Promise.all(seatPromises);
        console.log("Seats initialized successfully");
    }
};

// Initialize seats when server starts
initializeSeats();

// Get all seats
router.get("/", authMiddleware, async (req, res) => {
    try {
        const seats = await SeatModel.find().sort({ seatNumber: 1 });
        res.status(200).json(seats);
    } catch (error) {
        console.error("Error fetching seats:", error);
        res.status(500).json({ message: "Failed to fetch seats" });
    }
});

// Book seats
router.post("/book", authMiddleware, async (req, res) => {
    const { seatIds } = req.body;
    const userId = req.user.userId;

    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
        return res.status(400).json({ message: "No seats selected" });
    }

    if (seatIds.length > 7) {
        return res.status(400).json({ message: "You can only book up to 7 seats at a time" });
    }

    try {
        // Check if any of the selected seats are already booked
        const selectedSeats = await SeatModel.find({ _id: { $in: seatIds } });
        
        if (selectedSeats.length !== seatIds.length) {
            return res.status(404).json({ message: "Some selected seats do not exist" });
        }
        
        const bookedSeat = selectedSeats.find(seat => seat.booked);
        if (bookedSeat) {
            return res.status(400).json({ message: `Seat ${bookedSeat.seatNumber} is already booked` });
        }

        // Book all selected seats
        await SeatModel.updateMany(
            { _id: { $in: seatIds } },
            { booked: true, bookedBy: userId }
        );

        res.status(200).json({ message: "Seats booked successfully" });
    } catch (error) {
        console.error("Error booking seats:", error);
        res.status(500).json({ message: "Failed to book seats" });
    }
});

// Suggest seats based on requirements
router.get("/suggest", authMiddleware, async (req, res) => {
    const count = parseInt(req.query.count || "1");
    
    if (isNaN(count) || count < 1 || count > 7) {
        return res.status(400).json({ message: "Please provide a valid count between 1 and 7" });
    }

    try {
        const allSeats = await SeatModel.find({ booked: false }).sort({ seatNumber: 1 });
        
        if (allSeats.length < count) {
            return res.status(400).json({ message: "Not enough seats available" });
        }

        // Improved seat suggestion algorithm
        // First, organize seats by row
        const rows = [];
        const rowSize = 7; // Default row size
        
        allSeats.forEach(seat => {
            // Calculate which row this seat belongs to
            // Row 1-11 have 7 seats each, row 12 has 3 seats
            let seatRow;
            if (seat.seatNumber <= 77) {
                seatRow = Math.ceil(seat.seatNumber / rowSize);
            } else {
                seatRow = 12; // Last row
            }
            
            // Initialize row if it doesn't exist yet
            if (!rows[seatRow - 1]) {
                rows[seatRow - 1] = [];
            }
            
            // Add seat to row
            rows[seatRow - 1].push(seat);
        });
        
        // Sort seats within each row by seat number
        rows.forEach(row => {
            if (row) {
                row.sort((a, b) => a.seatNumber - b.seatNumber);
            }
        });
        
        // Now find the best row for consecutive seats
        let bestRow = null;
        let bestConsecutiveCount = 0;
        let bestConsecutiveStart = 0;
        
        rows.forEach((row, rowIndex) => {
            if (row && row.length >= count) {
                // Check for consecutive seats
                let maxConsecutive = 1;
                let currentConsecutive = 1;
                let consecutiveStart = 0;
                
                for (let i = 1; i < row.length; i++) {
                    if (row[i].seatNumber === row[i-1].seatNumber + 1) {
                        currentConsecutive++;
                        
                        if (currentConsecutive > maxConsecutive) {
                            maxConsecutive = currentConsecutive;
                            consecutiveStart = i - currentConsecutive + 1;
                        }
                    } else {
                        currentConsecutive = 1;
                    }
                }
                
                if (maxConsecutive >= count && maxConsecutive > bestConsecutiveCount) {
                    bestRow = rowIndex;
                    bestConsecutiveCount = maxConsecutive;
                    bestConsecutiveStart = consecutiveStart;
                }
            }
        });
        
        // If we found a row with enough consecutive seats
        if (bestRow !== null && bestConsecutiveCount >= count) {
            return res.status(200).json(rows[bestRow].slice(bestConsecutiveStart, bestConsecutiveStart + count));
        }
        
        // If no consecutive seats in a single row, find the row with most available seats
        let rowWithMostSeats = rows.reduce((maxRow, currentRow, index) => {
            return currentRow && currentRow.length > maxRow.length ? currentRow : maxRow;
        }, []);
        
        // If we have a row with enough seats, use that
        if (rowWithMostSeats.length >= count) {
            return res.status(200).json(rowWithMostSeats.slice(0, count));
        }
        
        // If no single row has enough seats, collect seats from multiple rows
        // Starting with rows that have the most available seats
        let suggestedSeats = [];
        let remainingCount = count;
        
        // Sort rows by number of available seats (descending)
        const sortedRows = [...rows]
            .filter(row => row && row.length > 0)
            .sort((a, b) => b.length - a.length);
        
        for (const row of sortedRows) {
            if (row.length > 0) {
                const seatsToTake = Math.min(remainingCount, row.length);
                suggestedSeats = [...suggestedSeats, ...row.slice(0, seatsToTake)];
                remainingCount -= seatsToTake;
                
                if (remainingCount === 0) break;
            }
        }
        
        res.status(200).json(suggestedSeats);
    } catch (error) {
        console.error("Error suggesting seats:", error);
        res.status(500).json({ message: "Failed to suggest seats" });
    }
});

// Cancel user's bookings
router.post("/cancel", authMiddleware, async (req, res) => {
    const userId = req.user.userId;

    try {
        const result = await SeatModel.updateMany(
            { bookedBy: userId },
            { booked: false, bookedBy: null }
        );

        if (result.modifiedCount > 0) {
            res.status(200).json({ message: "Your bookings have been canceled" });
        } else {
            res.status(200).json({ message: "You don't have any bookings to cancel" });
        }
    } catch (error) {
        console.error("Error canceling bookings:", error);
        res.status(500).json({ message: "Failed to cancel bookings" });
    }
});

// Reset all bookings (admin feature, could be restricted further)
router.post("/reset", authMiddleware, async (req, res) => {
    try {
        await SeatModel.updateMany(
            {},
            { booked: false, bookedBy: null }
        );

        res.status(200).json({ message: "All bookings have been reset" });
    } catch (error) {
        console.error("Error resetting bookings:", error);
        res.status(500).json({ message: "Failed to reset bookings" });
    }
});

module.exports = router;