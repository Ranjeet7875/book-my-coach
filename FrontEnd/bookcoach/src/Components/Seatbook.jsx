import { useState, useEffect } from 'react';
import './Seatbook.css'; // We'll keep your existing CSS

const TrainSeatBooking = () => {
  const [seats, setSeats] = useState([]);
  const [numSeats, setNumSeats] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('user123'); // Simulated user ID
  const [suggestedSeats, setSuggestedSeats] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);

  // Initialize seats
  useEffect(() => {
    initializeSeats();
  }, []);

  const initializeSeats = () => {
    setLoading(true);
    const initialSeats = [];
    for (let i = 1; i <= 80; i++) {
      initialSeats.push({
        _id: `seat_${i}`,
        seatNumber: i,
        booked: false,
        bookedBy: null
      });
    }
    
    // For demonstration, mark some seats as booked
    const bookedSeatNumbers = [6, 7, 19, 20, 21, 27, 35, 41, 42, 47, 48, 49, 55, 56, 63];
    
    bookedSeatNumbers.forEach(num => {
      const index = initialSeats.findIndex(s => s.seatNumber === num);
      if (index !== -1) {
        initialSeats[index].booked = true;
        initialSeats[index].bookedBy = 'otherUser';
      }
    });
    
    setSeats(initialSeats);
    setSuggestedSeats([]);
    setPreviewMode(false);
    setLoading(false);
  };

  const handlePreview = () => {
    const seatCount = parseInt(numSeats);

    // Validate input
    if (!seatCount || isNaN(seatCount) || seatCount < 1 || seatCount > 7) {
      setMessage('Please enter a valid number between 1 and 7');
      setMessageType('error');
      return;
    }

    // Find best available seats
    const bestSeats = findBestSeats(seatCount);

    if (!bestSeats || bestSeats.length === 0) {
      setMessage('No suitable seats available');
      setMessageType('error');
      return;
    }

    // Show suggested seats
    setSuggestedSeats(bestSeats);
    setPreviewMode(true);
    setMessage(`${bestSeats.length} seats suggested. Click Book to confirm.`);
    setMessageType('info');
  };

  const handleBook = () => {
    if (!previewMode || suggestedSeats.length === 0) {
      handlePreview();
      return;
    }

    // Book the suggested seats
    bookSeats(suggestedSeats);
    setPreviewMode(false);
    setSuggestedSeats([]);
  };

  const findBestSeats = (count) => {
    const availableSeats = seats.filter(seat => !seat.booked);
    
    if (availableSeats.length < count) {
      return [];
    }

    // Group seats by row
    const rows = {};
    
    availableSeats.forEach(seat => {
      const rowNumber = Math.ceil(seat.seatNumber / 7);
      if (!rows[rowNumber]) {
        rows[rowNumber] = [];
      }
      rows[rowNumber].push(seat);
    });
    
    // Sort seats within each row
    Object.keys(rows).forEach(rowNum => {
      rows[rowNum].sort((a, b) => a.seatNumber - b.seatNumber);
    });
    
    // Strategy 1: Find consecutive seats in a single row
    for (const rowNum in rows) {
      const row = rows[rowNum];
      if (row.length >= count) {
        // Look for consecutive seats
        for (let i = 0; i <= row.length - count; i++) {
          let consecutive = true;
          for (let j = 0; j < count - 1; j++) {
            if (row[i + j + 1].seatNumber !== row[i + j].seatNumber + 1) {
              consecutive = false;
              break;
            }
          }
          if (consecutive) {
            return row.slice(i, i + count);
          }
        }
      }
    }
    
    // Strategy 2: Find row with the most available seats
    let bestRow = null;
    let maxSeatsInRow = 0;
    
    for (const rowNum in rows) {
      if (rows[rowNum].length > maxSeatsInRow) {
        maxSeatsInRow = rows[rowNum].length;
        bestRow = rowNum;
      }
    }
    
    if (bestRow && rows[bestRow].length >= count) {
      return rows[bestRow].slice(0, count);
    }
    
    // Strategy 3: Take seats from multiple rows, prioritizing rows with more available seats
    const sortedRows = Object.values(rows).sort((a, b) => b.length - a.length);
    
    let result = [];
    let remainingCount = count;
    
    for (const row of sortedRows) {
      const seatsToTake = Math.min(remainingCount, row.length);
      result = [...result, ...row.slice(0, seatsToTake)];
      remainingCount -= seatsToTake;
      
      if (remainingCount === 0) break;
    }
    
    return result;
  };

  const bookSeats = (seatsToBook) => {
    const updatedSeats = [...seats];
    const bookedSeatNumbers = [];

    seatsToBook.forEach(seat => {
      const index = updatedSeats.findIndex(s => s._id === seat._id);
      if (index !== -1) {
        updatedSeats[index] = {
          ...updatedSeats[index],
          booked: true,
          bookedBy: userId
        };
        bookedSeatNumbers.push(seat.seatNumber);
      }
    });

    setSeats(updatedSeats);
    setMessage(`Seats ${bookedSeatNumbers.join(', ')} successfully booked`);
    setMessageType('success');
    setNumSeats('');
    
    // Hide message after 5 seconds
    setTimeout(() => {
      setMessage('');
    }, 5000);
  };

  const handleResetBooking = () => {
    initializeSeats();
    setMessage('All bookings have been reset');
    setMessageType('success');
    
    // Hide message after 3 seconds
    setTimeout(() => {
      setMessage('');
    }, 3000);
  };

  const cancelPreview = () => {
    setPreviewMode(false);
    setSuggestedSeats([]);
    setMessage('');
  };

  // Get seat class name based on its status
  const getSeatClassName = (seat) => {
    if (suggestedSeats.some(s => s._id === seat._id)) return 'seat-suggested';
    if (seat.booked && seat.bookedBy === userId) return 'seat-your-booking';
    if (seat.booked) return 'seat-booked';
    return 'seat-available';
  };

  // Organize seats into rows for the view
  const renderSeats = () => {
    const rows = [];
    
    // Group seats into rows (11 rows of 7 seats, plus row 12 with 3 seats)
    for (let rowIndex = 0; rowIndex < 12; rowIndex++) {
      const rowSeats = [];
      const seatsInRow = rowIndex === 11 ? 3 : 7; // Last row has only 3 seats
      
      for (let i = 0; i < seatsInRow; i++) {
        const seatNumber = rowIndex * 7 + i + 1;
        if (seatNumber <= 80) {
          const seat = seats.find(s => s.seatNumber === seatNumber);
          if (seat) rowSeats.push(seat);
        }
      }
      
      rows.push(rowSeats);
    }
    
    return (
      <div className="seat-container">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="seat-row">
            {row.map(seat => (
              <div
                key={seat._id}
                className={`seat ${getSeatClassName(seat)}`}
                title={`Seat ${seat.seatNumber}`}
              >
                {seat.seatNumber}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  // Render selected seats display
  const renderSelectedSeatsDisplay = () => {
    if (!suggestedSeats.length) return null;
    
    const seatNumbers = suggestedSeats.map(seat => seat.seatNumber).sort((a, b) => a - b);
    
    return (
      <div className="selected-seats-display">
        <div className="selected-seats-label">Selected Seats</div>
        <div className="selected-seats-numbers">
          {seatNumbers.map(seatNum => (
            <div key={seatNum} className="selected-seat-number">{seatNum}</div>
          ))}
        </div>
      </div>
    );
  };

  // Count stats
  const bookedSeatsCount = seats.filter(seat => seat.booked).length;
  const availableSeatsCount = seats.length - bookedSeatsCount;

  return (
    <div className="train-booking-container">
      <h2 className="booking-header">Train Seat Booking</h2>
      
      {loading ? (
        <div className="loading-container">Loading seats...</div>
      ) : (
        <>
          <div className="booking-legend">
            <div className="legend-item">
              <div className="legend-color seat-available"></div>
              <div>Available</div>
            </div>
            <div className="legend-item">
              <div className="legend-color seat-booked"></div>
              <div>Booked</div>
            </div>
            <div className="legend-item">
              <div className="legend-color seat-your-booking"></div>
              <div>Your Booking</div>
            </div>
            {previewMode && (
              <div className="legend-item">
                <div className="legend-color seat-suggested"></div>
                <div>Suggested</div>
              </div>
            )}
          </div>
          
          <div className="seat-layout">
            {renderSeats()}
          </div>
          
          <div className="booking-stats">
            <div className="stat-booked">Booked Seats = {bookedSeatsCount}</div>
            <div className="stat-available">Available Seats = {availableSeatsCount}</div>
          </div>
          
          <div className="booking-controls">
            {renderSelectedSeatsDisplay()}
            
            <div className="booking-form">
              <input
                type="number"
                min="1"
                max="7"
                value={numSeats}
                onChange={(e) => setNumSeats(e.target.value)}
                placeholder="Number of seats (1-7)"
                className="seat-count-input"
                disabled={previewMode}
              />
              
              {previewMode ? (
                <div className="preview-buttons">
                  <button 
                    onClick={handleBook}
                    className="book-button"
                  >
                    Confirm Booking
                  </button>
                  <button 
                    onClick={cancelPreview}
                    className="cancel-button"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handlePreview}
                  className="preview-button"
                  disabled={!numSeats}
                >
                  Find Seats
                </button>
              )}
            </div>
            
            <button 
              onClick={handleResetBooking}
              className="reset-button"
            >
              Reset All Bookings
            </button>
          </div>
          
          {message && (
            <div className={`booking-message ${messageType}`}>
              {messageType === 'success' && <span className="success-icon">✓</span>}
              {message}
              <button 
                className="close-message"
                onClick={() => setMessage('')}
              >
                ×
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TrainSeatBooking;