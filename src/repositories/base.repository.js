const fs = require('fs');
const path = require('path');

class BaseRepository {
  constructor(fileName) {
    this.filePath = path.join(__dirname, '..', '..', 'data', fileName);
  }

  read() {
    try {
      if (!fs.existsSync(this.filePath)) {
        return [];
      }
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data || '[]');
    } catch (err) {
      console.error(`[BaseRepository] Read error on ${this.filePath}:`, err.message);
      return [];
    }
  }

  write(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error(`[BaseRepository] Write error on ${this.filePath}:`, err.message);
      return false;
    }
  }
}

module.exports = BaseRepository;
