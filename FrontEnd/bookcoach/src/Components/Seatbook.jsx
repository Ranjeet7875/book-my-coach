import { useState, useEffect } from 'react';
import './Seatbook.css'; 

const TrainSeatBooking = () => {
  const [seats, setSeats] = useState([]);
  const [numSeats, setNumSeats] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('user123'); 
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

  // Get the row number from a seat number
  const getRowNumber = (seatNumber) => Math.ceil(seatNumber / 7);
  
  // Get all seats in a specific row
  const getSeatsInRow = (rowNumber, seatsArray) => {
    const startSeat = (rowNumber - 1) * 7 + 1;
    const endSeat = rowNumber === 12 ? 80 : rowNumber * 7;
    
    return seatsArray.filter(seat => 
      seat.seatNumber >= startSeat && 
      seat.seatNumber <= endSeat
    ).sort((a, b) => a.seatNumber - b.seatNumber);
  };

  // Find nearby seats in the same row
  const findNearbySeatsInRow = (rowSeats, count) => {
    // If we have enough seats in this row
    if (rowSeats.length < count) return null;
    
    const availableSeats = rowSeats.filter(seat => !seat.booked);
    if (availableSeats.length < count) return null;
    
    // Find clusters of available seats
    const clusters = [];
    let currentCluster = [];
    
    for (let i = 0; i < rowSeats.length; i++) {
      const seat = rowSeats[i];
      
      if (!seat.booked) {
        currentCluster.push(seat);
      } else if (currentCluster.length > 0) {
        clusters.push([...currentCluster]);
        currentCluster = [];
      }
    }
    
    if (currentCluster.length > 0) {
      clusters.push(currentCluster);
    }
    
    // Find the best cluster
    let bestCluster = null;
    
    for (const cluster of clusters) {
      if (cluster.length >= count) {
        // If the cluster has exactly our count or we don't have a best cluster yet
        if (!bestCluster || Math.abs(cluster.length - count) < Math.abs(bestCluster.length - count)) {
          bestCluster = cluster;
        }
      }
    }
    
    if (bestCluster) {
      // Take seats from the middle of the cluster to keep groups together
      const startIndex = Math.floor((bestCluster.length - count) / 2);
      return bestCluster.slice(startIndex, startIndex + count);
    }
    
    // If we can't find a perfect cluster, try to find seats that are as close as possible
    const sortedByAvailability = [...availableSeats];
    
    // Find the seat with the most adjacent available seats
    let bestSeat = null;
    let maxAdjacentSeats = -1;
    
    for (const seat of sortedByAvailability) {
      let adjacentCount = 0;
      const seatIndex = rowSeats.findIndex(s => s._id === seat._id);
      
      // Check left and right from this seat
      for (let i = 1; i < count; i++) {
        if (seatIndex - i >= 0 && !rowSeats[seatIndex - i].booked) adjacentCount++;
        if (seatIndex + i < rowSeats.length && !rowSeats[seatIndex + i].booked) adjacentCount++;
      }
      
      if (adjacentCount > maxAdjacentSeats) {
        maxAdjacentSeats = adjacentCount;
        bestSeat = seat;
      }
    }
    
    if (bestSeat) {
      const result = [bestSeat];
      const bestSeatIndex = rowSeats.findIndex(s => s._id === bestSeat._id);
      
      // Try to find adjacent seats in both directions
      const leftIndices = [];
      const rightIndices = [];
      
      for (let i = 1; i < rowSeats.length; i++) {
        if (bestSeatIndex - i >= 0 && !rowSeats[bestSeatIndex - i].booked) {
          leftIndices.push(bestSeatIndex - i);
        }
        
        if (bestSeatIndex + i < rowSeats.length && !rowSeats[bestSeatIndex + i].booked) {
          rightIndices.push(bestSeatIndex + i);
        }
        
        if (leftIndices.length + rightIndices.length >= count - 1) break;
      }
      
      // Prioritize seats closer to the best seat
      const allIndices = [];
      for (let i = 0; i < Math.max(leftIndices.length, rightIndices.length); i++) {
        if (i < rightIndices.length) allIndices.push(rightIndices[i]);
        if (i < leftIndices.length) allIndices.push(leftIndices[i]);
      }
      
      // Add the closest seats to our result
      for (let i = 0; i < Math.min(count - 1, allIndices.length); i++) {
        result.push(rowSeats[allIndices[i]]);
      }
      
      return result;
    }
    
    return null;
  };

  const findBestSeats = (count) => {
    const availableSeats = seats.filter(seat => !seat.booked);
    
    if (availableSeats.length < count) {
      return [];
    }

    // Group seats by row and check seat occupancy per row
    const rowOccupancy = {};
    const rows = {};
    
    // Set up row data
    for (let i = 1; i <= 12; i++) {
      const rowSeats = getSeatsInRow(i, seats);
      const seatsInThisRow = rowSeats.length;
      const bookedSeatsInRow = rowSeats.filter(seat => seat.booked).length;
      const occupancyRate = bookedSeatsInRow / seatsInThisRow;
      
      rowOccupancy[i] = occupancyRate;
      rows[i] = rowSeats;
    }
    
    // Sort rows by occupancy (partially filled rows first, excluding fully booked rows)
    const partiallyFilledRows = Object.keys(rowOccupancy)
      .filter(rowNum => rowOccupancy[rowNum] > 0 && rowOccupancy[rowNum] < 1)
      .sort((a, b) => rowOccupancy[b] - rowOccupancy[a])
      .map(rowNum => parseInt(rowNum));
    
    // Empty rows as fallback
    const emptyRows = Object.keys(rowOccupancy)
      .filter(rowNum => rowOccupancy[rowNum] === 0)
      .map(rowNum => parseInt(rowNum));
    
    // Try to find nearby seats in partially filled rows first
    for (const rowNum of partiallyFilledRows) {
      const rowSeats = rows[rowNum];
      const nearbySeats = findNearbySeatsInRow(rowSeats, count);
      
      if (nearbySeats && nearbySeats.length >= count) {
        return nearbySeats.slice(0, count);
      }
    }
    
    // If no partially filled rows work, try empty rows
    for (const rowNum of emptyRows) {
      const rowSeats = rows[rowNum];
      const availableInRow = rowSeats.filter(seat => !seat.booked);
      
      if (availableInRow.length >= count) {
        // Return consecutive seats in an empty row
        return availableInRow.slice(0, count);
      }
    }
    
    // Strategy 1: Find consecutive seats in a single row (original method)
    for (const rowNum in rows) {
      const row = rows[rowNum].filter(seat => !seat.booked);
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
      const availableInRow = rows[rowNum].filter(seat => !seat.booked);
      if (availableInRow.length > maxSeatsInRow) {
        maxSeatsInRow = availableInRow.length;
        bestRow = rowNum;
      }
    }
    
    if (bestRow && rows[bestRow].filter(seat => !seat.booked).length >= count) {
      return rows[bestRow].filter(seat => !seat.booked).slice(0, count);
    }
    
    // Strategy 3: Take seats from multiple rows, prioritizing rows with more available seats
    const sortedRows = Object.values(rows)
      .map(row => row.filter(seat => !seat.booked))
      .filter(row => row.length > 0)
      .sort((a, b) => b.length - a.length);
    
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
    setMessage(`Seats ${bookedSeatNumbers.sort((a, b) => a - b).join(', ')} successfully booked`);
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

  // Get row occupancy information
  const getRowOccupancyInfo = () => {
    const rowInfo = [];
    
    for (let rowNum = 1; rowNum <= 12; rowNum++) {
      const rowSeats = getSeatsInRow(rowNum, seats);
      const totalSeats = rowSeats.length;
      const bookedSeats = rowSeats.filter(seat => seat.booked).length;
      const availableSeats = totalSeats - bookedSeats;
      const occupancyRate = bookedSeats / totalSeats;
      
      rowInfo.push({
        rowNum,
        totalSeats,
        bookedSeats,
        availableSeats,
        occupancyRate
      });
    }
    
    return rowInfo;
  };

  // Count stats
  const bookedSeatsCount = seats.filter(seat => seat.booked).length;
  const availableSeatsCount = seats.length - bookedSeatsCount;
  const rowOccupancyInfo = getRowOccupancyInfo();

  // Find partially filled rows (for debugging purposes)
  const partiallyFilledRows = rowOccupancyInfo
    .filter(row => row.occupancyRate > 0 && row.occupancyRate < 1)
    .map(row => row.rowNum);

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