"""Unit tests for ScheduleParserService."""
import pytest
from datetime import date, datetime, time
from unittest.mock import patch

from app.services.schedule_parser import ScheduleParserService


class TestScheduleParserService:
    """Test cases for ScheduleParserService."""

    def setup_method(self):
        """Set up test instances."""
        self.parser = ScheduleParserService()

    @pytest.mark.unit
    def test_parse_schedule_string_simple_recurring(self):
        """Test parsing simple recurring schedule."""
        schedule = "Mon/Wed/Fri 7:00 AM"
        result = self.parser.parse_schedule_string(schedule)

        assert result["type"] == "weekly_recurring"
        assert result["pattern"]["days"] == ["monday", "wednesday", "friday"]
        assert result["pattern"]["time"] == "07:00"
        assert result["pattern"]["timezone"] == "America/New_York"

    @pytest.mark.unit
    def test_parse_schedule_string_complex_format(self):
        """Test parsing complex format with full day names."""
        schedule = "mon/wed/fri 7:00 AM"
        result = self.parser.parse_schedule_string(schedule)

        assert result["type"] == "weekly_recurring"
        assert result["pattern"]["days"] == ["monday", "wednesday", "friday"]
        assert result["pattern"]["time"] == "07:00"

    @pytest.mark.unit
    def test_parse_schedule_string_single_day(self):
        """Test parsing single day schedule."""
        schedule = "Monday 7:00 AM"
        result = self.parser.parse_schedule_string(schedule)

        assert result["type"] == "weekly_recurring"
        assert result["pattern"]["days"] == ["monday"]
        assert result["pattern"]["time"] == "07:00"

    @pytest.mark.unit
    def test_parse_schedule_string_pm_time(self):
        """Test parsing PM time."""
        schedule = "Tue/Thu 6:30 PM"
        result = self.parser.parse_schedule_string(schedule)

        assert result["type"] == "weekly_recurring"
        assert result["pattern"]["days"] == ["tuesday", "thursday"]
        assert result["pattern"]["time"] == "18:30"

    @pytest.mark.unit
    def test_parse_schedule_string_24_hour_format(self):
        """Test parsing 24-hour time format."""
        schedule = "Mon/Wed/Fri 19:00"
        result = self.parser.parse_schedule_string(schedule)

        assert result["type"] == "weekly_recurring"
        assert result["pattern"]["days"] == ["monday", "wednesday", "friday"]
        assert result["pattern"]["time"] == "19:00"

    @pytest.mark.unit
    def test_parse_schedule_string_case_insensitive(self):
        """Test case insensitive day parsing."""
        schedule = "MONDAY/wednesday/FrI 7:00 am"
        result = self.parser.parse_schedule_string(schedule)

        assert result["type"] == "weekly_recurring"
        assert result["pattern"]["days"] == ["monday", "wednesday", "friday"]
        assert result["pattern"]["time"] == "07:00"

    @pytest.mark.unit
    def test_parse_schedule_string_short_day_names(self):
        """Test parsing with short day names."""
        schedule = "Mon/Wed/Fri 7:00 AM"
        result = self.parser.parse_schedule_string(schedule)

        assert result["pattern"]["days"] == ["monday", "wednesday", "friday"]

    @pytest.mark.unit
    def test_parse_schedule_string_invalid_format(self):
        """Test parsing invalid schedule format."""
        schedule = "Every other Tuesday maybe"
        result = self.parser.parse_schedule_string(schedule)

        assert result["type"] == "custom"
        assert result["original_schedule"] == schedule

    @pytest.mark.unit
    def test_parse_schedule_string_empty(self):
        """Test parsing empty schedule string."""
        result = self.parser.parse_schedule_string("")

        assert result["type"] == "custom"
        assert result["original_schedule"] == ""

    @pytest.mark.unit
    def test_parse_schedule_string_none(self):
        """Test parsing None schedule string."""
        result = self.parser.parse_schedule_string(None)

        assert result["type"] == "custom"
        assert result["original_schedule"] is None

    @pytest.mark.unit
    def test_validate_target_date_valid_weekday(self, sample_schedule_data):
        """Test validating target date on valid weekday."""
        target_date = date(2024, 3, 11)  # Monday
        target_time = time(7, 0)

        is_valid = self.parser.validate_target_date(
            sample_schedule_data, target_date, target_time
        )

        assert is_valid is True

    @pytest.mark.unit
    def test_validate_target_date_invalid_weekday(self, sample_schedule_data):
        """Test validating target date on invalid weekday."""
        target_date = date(2024, 3, 12)  # Tuesday (not in Mon/Wed/Fri)
        target_time = time(7, 0)

        is_valid = self.parser.validate_target_date(
            sample_schedule_data, target_date, target_time
        )

        assert is_valid is False

    @pytest.mark.unit
    def test_validate_target_date_time_flexibility(self, sample_schedule_data):
        """Test time validation with 15-minute flexibility."""
        target_date = date(2024, 3, 11)  # Monday

        # Exactly on time
        assert self.parser.validate_target_date(
            sample_schedule_data, target_date, time(7, 0)
        ) is True

        # Within 15 minutes
        assert self.parser.validate_target_date(
            sample_schedule_data, target_date, time(7, 10)
        ) is True

        # Outside 15 minutes
        assert self.parser.validate_target_date(
            sample_schedule_data, target_date, time(7, 20)
        ) is False

    @pytest.mark.unit
    def test_validate_target_date_with_exceptions(self, sample_schedule_data):
        """Test validation with exception dates."""
        sample_schedule_data["exceptions"] = ["2024-03-11"]
        target_date = date(2024, 3, 11)  # Monday, but in exceptions
        target_time = time(7, 0)

        is_valid = self.parser.validate_target_date(
            sample_schedule_data, target_date, target_time
        )

        assert is_valid is False

    @pytest.mark.unit
    def test_validate_target_date_with_date_range(self, sample_schedule_data):
        """Test validation with date range restrictions."""
        sample_schedule_data["date_range"] = {
            "start_date": "2024-03-15",
            "end_date": "2024-03-31"
        }

        # Before start date
        assert self.parser.validate_target_date(
            sample_schedule_data, date(2024, 3, 11), time(7, 0)
        ) is False

        # Within range
        assert self.parser.validate_target_date(
            sample_schedule_data, date(2024, 3, 15), time(7, 0)
        ) is True

        # After end date
        assert self.parser.validate_target_date(
            sample_schedule_data, date(2024, 4, 1), time(7, 0)
        ) is False

    @pytest.mark.unit
    def test_validate_target_date_custom_type(self):
        """Test validation for custom schedule type."""
        custom_schedule = {"type": "custom"}
        target_date = date(2024, 3, 11)
        target_time = time(7, 0)

        is_valid = self.parser.validate_target_date(
            custom_schedule, target_date, target_time
        )

        assert is_valid is True

    @pytest.mark.unit
    def test_get_next_available_dates(self, sample_schedule_data):
        """Test getting next available dates."""
        from_date = date(2024, 3, 10)  # Sunday
        limit = 5

        dates = self.parser.get_next_available_dates(
            sample_schedule_data, from_date, limit
        )

        assert len(dates) == 5
        # Should return Mon, Wed, Fri, Mon, Wed
        expected_weekdays = [0, 2, 4, 0, 2]  # Monday=0, Wednesday=2, Friday=4
        actual_weekdays = [d.weekday() for d in dates]
        assert actual_weekdays == expected_weekdays

    @pytest.mark.unit
    def test_get_next_available_dates_with_exceptions(self, sample_schedule_data):
        """Test getting next available dates with exceptions."""
        sample_schedule_data["exceptions"] = ["2024-03-11", "2024-03-15"]
        from_date = date(2024, 3, 10)  # Sunday
        limit = 3

        dates = self.parser.get_next_available_dates(
            sample_schedule_data, from_date, limit
        )

        # Should skip the exception dates
        assert len(dates) == 3
        assert date(2024, 3, 11) not in [d.date() for d in dates]
        assert date(2024, 3, 15) not in [d.date() for d in dates]

    @pytest.mark.unit
    def test_get_next_available_dates_with_date_range(self, sample_schedule_data):
        """Test getting dates within date range."""
        sample_schedule_data["date_range"] = {
            "start_date": "2024-03-15",
            "end_date": "2024-03-31"
        }
        from_date = date(2024, 3, 10)
        limit = 10

        dates = self.parser.get_next_available_dates(
            sample_schedule_data, from_date, limit
        )

        # All dates should be within the specified range
        for d in dates:
            assert d.date() >= date(2024, 3, 15)
            assert d.date() <= date(2024, 3, 31)

    @pytest.mark.unit
    def test_get_next_available_dates_custom_type(self):
        """Test getting dates for custom schedule type."""
        custom_schedule = {"type": "custom"}
        from_date = date(2024, 3, 10)
        limit = 5

        dates = self.parser.get_next_available_dates(
            custom_schedule, from_date, limit
        )

        assert dates == []

    @pytest.mark.unit
    def test_schedule_to_user_friendly_string_recurring(self, sample_schedule_data):
        """Test converting schedule data to user-friendly string."""
        result = self.parser.schedule_to_user_friendly_string(sample_schedule_data)

        assert "Monday" in result
        assert "Wednesday" in result
        assert "Friday" in result
        assert "7:00 AM" in result

    @pytest.mark.unit
    def test_schedule_to_user_friendly_string_custom(self):
        """Test converting custom schedule to user-friendly string."""
        custom_schedule = {
            "type": "custom",
            "original_schedule": "By appointment only"
        }

        result = self.parser.schedule_to_user_friendly_string(custom_schedule)
        assert result == "By appointment only"

    @pytest.mark.unit
    def test_schedule_to_user_friendly_string_empty(self):
        """Test converting empty schedule to user-friendly string."""
        empty_schedule = {}

        result = self.parser.schedule_to_user_friendly_string(empty_schedule)
        assert result == "Schedule not specified"

    @pytest.mark.unit
    def test_get_day_name_from_number(self):
        """Test converting weekday number to day name."""
        assert self.parser._get_day_name_from_number(0) == "Monday"
        assert self.parser._get_day_name_from_number(1) == "Tuesday"
        assert self.parser._get_day_name_from_number(2) == "Wednesday"
        assert self.parser._get_day_name_from_number(3) == "Thursday"
        assert self.parser._get_day_name_from_number(4) == "Friday"
        assert self.parser._get_day_name_from_number(5) == "Saturday"
        assert self.parser._get_day_name_from_number(6) == "Sunday"

    @pytest.mark.unit
    def test_create_empty_schedule(self):
        """Test creating empty schedule structure."""
        result = self.parser._create_empty_schedule()

        assert result["type"] == "custom"
        assert result["pattern"] is None
        assert result["date_range"]["start_date"] is None
        assert result["date_range"]["end_date"] is None
        assert result["exceptions"] == []
        assert result["pattern"]["timezone"] == "America/New_York"

    @pytest.mark.unit
    def test_create_basic_schedule(self):
        """Test creating basic schedule for unparseable strings."""
        original = "Every other Tuesday"
        result = self.parser._create_basic_schedule(original)

        assert result["type"] == "custom"
        assert result["original_schedule"] == original

    @pytest.mark.unit
    def test_parse_multiple_day_formats(self):
        """Test parsing various day name formats."""
        formats = [
            "Mon/Tue/Wed 7:00 AM",
            "Monday/Tuesday/Wednesday 7:00 AM",
            "Mon, Tue, Wed 7:00 AM",
            "Monday, Tuesday, Wednesday 7:00 AM",
        ]

        for schedule in formats:
            result = self.parser.parse_schedule_string(schedule)
            assert result["pattern"]["days"] == ["monday", "tuesday", "wednesday"]

    @pytest.mark.unit
    def test_parse_edge_case_times(self):
        """Test parsing edge case time formats."""
        test_cases = [
            ("Mon 12:00 AM", "00:00"),  # Midnight
            ("Mon 12:00 PM", "12:00"),  # Noon
            ("Mon 12:30 AM", "00:30"),  # Past midnight
            ("Mon 12:30 PM", "12:30"),  # Past noon
            ("Mon 1:00 AM", "01:00"),   # 1 AM
            ("Mon 1:00 PM", "13:00"),   # 1 PM
        ]

        for schedule, expected_time in test_cases:
            result = self.parser.parse_schedule_string(schedule)
            assert result["pattern"]["time"] == expected_time

    @pytest.mark.unit
    def test_max_days_to_check_limit(self, sample_schedule_data):
        """Test that get_next_available_dates doesn't loop infinitely."""
        # Create a schedule with no valid days
        impossible_schedule = {
            "type": "weekly_recurring",
            "pattern": {
                "days": ["monday"],
                "time": "07:00",
            },
            "date_range": {
                "start_date": "2024-03-12",  # Tuesday
                "end_date": "2024-03-12",    # Same Tuesday (no Mondays)
            },
            "exceptions": [],
            "timezone": "UTC",
        }

        from_date = date(2024, 3, 10)
        limit = 10

        dates = self.parser.get_next_available_dates(
            impossible_schedule, from_date, limit
        )

        # Should return empty list, not loop forever
        assert dates == []

    @pytest.mark.unit
    def test_parse_schedule_string_regex_edge_cases(self):
        """Test edge cases in regex parsing."""
        edge_cases = [
            "Mon7:00AM",  # No space
            "Mon  7:00  AM",  # Multiple spaces
            "Mon/7:00 AM",  # Missing day after slash
            "Mon/Wed/ 7:00 AM",  # Trailing slash
            "/Mon/Wed 7:00 AM",  # Leading slash
        ]

        for schedule in edge_cases:
            result = self.parser.parse_schedule_string(schedule)
            # Should not crash, might fall back to custom type
            assert "type" in result
            assert "original_schedule" in result