# SaleOrderForecast Backend

This is the FastAPI backend for the SaleOrderForecast application. It provides a modern, high-performance API with automatic documentation, type validation using Pydantic, and dependency injection.

## Features

- **FastAPI Framework**: High-performance, easy to learn, fast to code, ready for production
- **Pydantic Models**: Data validation and settings management using Python type annotations
- **Automatic API Documentation**: Interactive API documentation with Swagger UI
- **Authentication**: JWT token-based authentication with role-based access control
- **Dependency Injection**: Clean, modular code with dependency injection
- **Google Sheets Integration**: Data retrieval from Google Sheets
- **Advanced Forecasting**: Multiple forecasting algorithms for sales prediction

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── api_v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.py
│   │   │   │   ├── deals.py
│   │   │   │   ├── forecasts.py
│   │   │   │   ├── sheets.py
│   │   │   │   └── __init__.py
│   │   │   ├── api.py
│   │   │   └── __init__.py
│   │   ├── deps.py
│   │   └── __init__.py
│   ├── core/
│   │   ├── config.py
│   │   └── __init__.py
│   ├── models/
│   │   └── __init__.py
│   ├── schemas/
│   │   ├── forecast.py
│   │   ├── token.py
│   │   ├── user.py
│   │   └── __init__.py
│   ├── services/
│   │   ├── forecast_service.py
│   │   ├── sheets_service.py
│   │   ├── user_service.py
│   │   └── __init__.py
│   ├── main.py
│   └── __init__.py
├── tests/
│   ├── api/
│   ├── services/
│   └── conftest.py
├── .env.example
├── main.py
├── requirements.txt
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. Clone the repository
2. Navigate to the backend directory:
   ```
   cd backend
   ```
3. Create a virtual environment:
   ```
   python -m venv venv
   ```
4. Activate the virtual environment:
   - Windows:
     ```
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```
     source venv/bin/activate
     ```
5. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
6. Create a `.env` file from the example:
   ```
   cp .env.example .env
   ```
7. Edit the `.env` file with your configuration values

### Running the Application

Run the application with:

```
python main.py
```

The API will be available at http://localhost:8000

API documentation will be available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Running Tests

Run tests with pytest:

```
pytest
```

Run tests with coverage:

```
pytest --cov=app
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/login` - Get access token
- `POST /api/v1/auth/refresh` - Refresh access token

### Forecasts

- `GET /api/v1/forecasts` - Get forecasts
- `POST /api/v1/forecasts/advanced` - Generate advanced forecasts

### Google Sheets

- `GET /api/v1/sheets/data` - Get data from Google Sheets

### Deals

- `GET /api/v1/deals` - Get deals
- `POST /api/v1/deals` - Create a deal
- `GET /api/v1/deals/{deal_id}` - Get a specific deal
- `PUT /api/v1/deals/{deal_id}` - Update a deal
- `DELETE /api/v1/deals/{deal_id}` - Delete a deal (admin only)

## Development

### Code Style

This project uses:
- Black for code formatting
- Flake8 for linting
- MyPy for static type checking

Format code with:

```
black app
```

Run linting with:

```
flake8 app
```

Run type checking with:

```
mypy app
```

### Adding New Endpoints

1. Create a new file in `app/api/api_v1/endpoints/`
2. Define your router and endpoints
3. Add your router to `app/api/api_v1/api.py`

### Adding New Pydantic Models

1. Create or update files in `app/schemas/`
2. Use Python type annotations for validation
3. Add example data in the Config class for documentation
