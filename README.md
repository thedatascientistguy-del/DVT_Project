# Energy Transition Analytics Dashboard

An interactive web-based data visualization system for analyzing global energy production, consumption, and emissions trends from 2000-2019. Built with D3.js v7 and Python preprocessing, this dashboard demonstrates advanced interactive visualization techniques with 15 comprehensive charts.

![Dashboard Preview](https://img.shields.io/badge/Status-Active-success)
![D3.js](https://img.shields.io/badge/D3.js-v7-orange)
![Python](https://img.shields.io/badge/Python-3.x-blue)

## 🌟 Features

### 15 Interactive Visualizations

**Trend Analysis** (Charts 1-5)
- Global Energy Consumption Trend
- CO₂ Emissions Trend
- Electricity Demand vs Generation
- Energy Mix: Fossil vs Renewable vs Nuclear
- Electricity Generation by Source

**Composition Analysis** (Charts 6-8)
- Fossil Fuel Breakdown (Coal/Oil/Gas)
- Renewable Energy Breakdown (Solar/Wind/Hydro)
- Low-Carbon Energy Trend

**Country Rankings** (Charts 9-10)
- Top Energy Consumers
- Per Capita Energy Usage

**Comparison Analysis** (Chart 11)
- Multi-Country Comparison (2-5 countries)

**Correlation Analysis** (Charts 12-13)
- GDP vs Energy Consumption
- Energy vs Emissions Correlation

**Advanced Metrics** (Charts 14-15)
- Renewable Energy Growth Rate
- Carbon Intensity of Electricity

### Interactive Features
- **Country Filter**: Analyze specific countries or global aggregates
- **Year Range Slider**: Focus on specific time periods (2000-2019)
- **Dynamic Updates**: All 15 charts update simultaneously with smooth animations
- **Tooltips**: Hover over data points for detailed information
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark Theme**: Eye-friendly dark mode with professional styling

## 🚀 Quick Start

### Prerequisites
- Python 3.x (for data preprocessing)
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+)
- Local web server (optional, for local testing)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd DVT_Project
   ```

2. **Run Python data preprocessing**
   ```bash
   # Install required Python packages
   pip install pandas numpy matplotlib seaborn

   # Run preprocessing pipeline
   cd preprocessing
   python data_preprocessing.py

   # Run EDA analysis (optional)
   python eda_analysis.py
   ```

3. **Open the dashboard**
   
   **Option A: Direct file access**
   - Open `index.html` in your web browser
   
   **Option B: Local HTTP server (recommended)**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Then open http://localhost:8000 in your browser
   ```
   
   **Option C: VS Code Live Server**
   - Install "Live Server" extension
   - Right-click `index.html` → "Open with Live Server"

## 📁 Project Structure

```
DVT_Project/
├── data/
│   ├── raw_energy_data.csv          # Original dataset
│   └── clean_energy.csv             # Processed dataset (generated)
├── preprocessing/
│   ├── data_preprocessing.py        # Data cleaning pipeline
│   ├── eda_analysis.py              # Exploratory data analysis
│   └── outputs/                     # EDA visualizations (generated)
├── js/
│   ├── config.js                    # Configuration and color schemes
│   ├── dataLoader.js                # CSV loading and parsing
│   ├── utils.js                     # Data aggregation utilities
│   ├── tooltip.js                   # Reusable tooltip component
│   ├── filters.js                   # Filter manager (observer pattern)
│   ├── app.js                       # Main application controller
│   └── charts/                      # Individual chart modules (15 files)
├── css/
│   └── styles.css                   # Dark theme styling
├── report/
│   └── project_report.md            # Detailed project documentation
├── index.html                       # Main dashboard page
└── README.md                        # This file
```

## 🛠️ Technologies Used

### Frontend
- **D3.js v7**: Advanced data visualization library
- **Vanilla JavaScript (ES6)**: Modular, maintainable code
- **HTML5 & CSS3**: Modern web standards
- **noUiSlider**: Dual-handle range slider

### Backend / Preprocessing
- **Python 3.x**: Data processing
- **pandas**: Data manipulation
- **numpy**: Numerical computations
- **matplotlib & seaborn**: EDA visualizations

### Deployment
- **GitHub Pages**: Static hosting (no backend required)
- **Pure Frontend Architecture**: Compatible with any static host

## 📊 Data Processing Pipeline

1. **Load Raw Data**: Read CSV with proper encoding
2. **Handle Missing Values**: Interpolation for time series continuity
3. **Type Conversion**: Ensure numeric columns are properly typed
4. **Year Filtering**: Filter to 2000-2019 range
5. **Column Removal**: Remove sparse columns (>30% missing)
6. **Name Standardization**: Convert to snake_case
7. **Derive Metrics**: Calculate total_energy, shares, low_carbon_energy
8. **Save Clean Data**: Output clean_energy.csv for dashboard

## 🌐 GitHub Pages Deployment

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Deploy Energy Transition Dashboard"
   git push origin main
   ```

2. **Enable GitHub Pages**
   - Go to repository Settings
   - Navigate to "Pages" section
   - Set source to "main" branch, root directory
   - Click "Save"

3. **Access your dashboard**
   - URL: `https://<username>.github.io/<repository-name>/`
   - Wait 1-2 minutes for deployment to complete

### Local Testing Methods

**Method 1: Python HTTP Server** (Recommended)
```bash
# Navigate to project root
cd DVT_Project

# Start server
python -m http.server 8000

# Open browser
open http://localhost:8000
```

**Method 2: VS Code Live Server**
- Install "Live Server" extension from VS Code marketplace
- Right-click `index.html` → "Open with Live Server"
- Dashboard opens automatically in browser

**Method 3: Node.js HTTP Server**
```bash
# Install http-server globally
npm install -g http-server

# Run server
http-server -p 8000

# Open http://localhost:8000
```

### Browser Compatibility

**Supported Browsers:**
- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅

**Required Features:**
- ES6 Modules (import/export)
- D3.js v7 compatibility
- CSS Grid Layout
- Fetch API

**Note**: Internet Explorer is **not supported** due to lack of ES6 module support.

### Troubleshooting Common Issues

**Issue 1: Charts not rendering**
- **Cause**: Missing `clean_energy.csv` file
- **Solution**: Run `python preprocessing/data_preprocessing.py` first
- **Verification**: Check that `data/clean_energy.csv` exists

**Issue 2: CORS errors in console**
- **Cause**: Opening `index.html` directly without HTTP server
- **Solution**: Use Python HTTP server or Live Server (see Local Testing Methods)
- **Why**: Browsers block file:// protocol from loading CSV files

**Issue 3: "D3 is not defined" error**
- **Cause**: CDN blocked or slow internet connection
- **Solution**: Wait for CDN to load, or check internet connection
- **Alternative**: Download D3.js locally and update script tag

**Issue 4: Filters not updating charts**
- **Cause**: JavaScript module loading error
- **Solution**: Open browser DevTools (F12) and check Console for errors
- **Verification**: Ensure all `.js` files in `js/` and `js/charts/` exist

**Issue 5: Year range slider not working**
- **Cause**: noUiSlider CDN not loaded
- **Solution**: Check internet connection or use fallback range input
- **Note**: Dashboard includes fallback for standard HTML range input

**Issue 6: Performance issues / slow updates**
- **Cause**: Large dataset or slow device
- **Solution**: Filter to specific country and smaller year range
- **Optimization**: Close other browser tabs to free memory

**Issue 7: Mobile layout broken**
- **Cause**: Browser zoom or viewport settings
- **Solution**: Reset browser zoom to 100%
- **Verification**: Test in Chrome DevTools mobile emulation mode

## 🎨 Design Principles

- **Modularity**: Reusable components with clear separation of concerns
- **Performance**: Efficient aggregation with 500ms smooth transitions
- **Consistency**: Centralized configuration for colors and styling
- **Robustness**: Graceful handling of missing data and edge cases
- **Accessibility**: High-contrast dark theme with clear labeling

## 🧪 Testing

### Manual Testing Checklist
- [ ] All 15 charts render without errors
- [ ] Country dropdown populates correctly
- [ ] Year range slider updates all charts
- [ ] Tooltips display accurate information
- [ ] Charts handle missing data gracefully
- [ ] Responsive layout works on mobile
- [ ] Animations are smooth (no jank)
- [ ] Browser console shows no errors

### Performance Targets
- Dashboard load time: < 3 seconds
- Filter update time: < 500ms
- No memory leaks during extended use

## 📖 Documentation

- **Design Document**: `.kiro/specs/energy-transition-dashboard/design.md`
- **Requirements**: `.kiro/specs/energy-transition-dashboard/requirements.md`
- **Tasks**: `.kiro/specs/energy-transition-dashboard/tasks.md`
- **Project Report**: `report/project_report.md` (CLO-5 documentation)

## 🤝 Contributing

This is an academic project. For questions or suggestions, please open an issue.

## 📝 License

This project is developed for educational purposes as part of a Data Visualization Techniques course.

## 🙏 Acknowledgments

- **Data Source**: Our World in Data - Energy Statistics
- **Visualization Library**: D3.js by Mike Bostock
- **Inspiration**: Bloomberg Terminal, Microsoft Power BI

## 📞 Contact

For questions about this project, please refer to the project report or open an issue on GitHub.

---

**Built with ❤️ for Data Visualization Techniques Course**
