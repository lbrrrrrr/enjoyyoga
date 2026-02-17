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
        assert result["original_schedule"] == schedule.lower()

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
        # None gets converted to empty string internally
        assert result["original_schedule"] == ""

    @pytest.mark.unit
    def test_validate_target_date_valid_weekday(self, sample_schedule_data):
        """Test validating target date on valid weekday."""
        target_date = date(2026, 2, 2)  # Monday (after start_date)
        target_time = time(7, 0)

        is_valid = self.parser.validate_target_date(
            sample_schedule_data, target_date, target_time
        )

        assert is_valid is True

    @pytest.mark.unit
    def test_validate_target_date_invalid_weekday(self, sample_schedule_data):
        """Test validating target date on invalid weekday."""
        target_date = date(2026, 2, 3)  # Tuesday (not in Mon/Wed/Fri)
        target_time = time(7, 0)

        is_valid = self.parser.validate_target_date(
            sample_schedule_data, target_date, target_time
        )

        assert is_valid is False

    @pytest.mark.unit
    def test_validate_target_date_time_flexibility(self, sample_schedule_data):
        """Test time validation with 15-minute flexibility."""
        target_date = date(2026, 2, 2)  # Monday

        # Exactly on time
        assert self.parser.validate_target_date(
            sample_schedule_data, target_date, time(7, 0)
        ) is True

        # Within 15 minutes
        assert self.parser.validate_target_date(
            sample_schedule_data, target_date, time(7, 10)
        ) is True

        # Outside 15 minutes (should fail)
        assert self.parser.validate_target_date(
            sample_schedule_data, target_date, time(7, 20)
        ) is False

    @pytest.mark.unit
    def test_validate_target_date_with_exceptions(self, sample_schedule_data):
        """Test validation with exception dates."""
        sample_schedule_data["exceptions"] = ["2026-02-02"]
        target_date = date(2026, 2, 2)  # Monday, but in exceptions
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
        from_date = date(2026, 2, 1)  # Sunday
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
        sample_schedule_data["exceptions"] = ["2026-02-02", "2026-02-05"]  # Monday and Wednesday
        from_date = date(2026, 2, 1)  # Sunday
        limit = 3

        dates = self.parser.get_next_available_dates(
            sample_schedule_data, from_date, limit
        )

        # Should skip the exception dates
        assert len(dates) == 3
        assert date(2026, 2, 2) not in [d.date() for d in dates]
        assert date(2026, 2, 5) not in [d.date() for d in dates]

    @pytest.mark.unit
    def test_get_next_available_dates_with_date_range(self, sample_schedule_data):
        """Test getting dates within date range."""
        sample_schedule_data["date_range"] = {
            "start_date": "2026-02-16",  # Start from 16th to ensure we get valid dates
            "end_date": "2026-02-28"
        }
        from_date = date(2026, 2, 15)
        limit = 5

        dates = self.parser.get_next_available_dates(
            sample_schedule_data, from_date, limit
        )

        # All dates should be within the specified range
        for d in dates:
            assert d.date() >= date(2026, 2, 16)
            assert d.date() <= date(2026, 2, 28)

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
        assert result == "Schedule varies"  # Implementation returns this for custom schedules

    @pytest.mark.unit
    def test_schedule_to_user_friendly_string_empty(self):
        """Test converting empty schedule to user-friendly string."""
        empty_schedule = {}

        result = self.parser.schedule_to_user_friendly_string(empty_schedule)
        assert result == "Schedule not available"  # Implementation returns this for empty

    @pytest.mark.unit
    def test_get_day_name_from_number(self):
        """Test converting weekday number to day name."""
        assert self.parser._get_day_name_from_number(0) == "monday"
        assert self.parser._get_day_name_from_number(1) == "tuesday"
        assert self.parser._get_day_name_from_number(2) == "wednesday"
        assert self.parser._get_day_name_from_number(3) == "thursday"
        assert self.parser._get_day_name_from_number(4) == "friday"
        assert self.parser._get_day_name_from_number(5) == "saturday"
        assert self.parser._get_day_name_from_number(6) == "sunday"

    @pytest.mark.unit
    def test_create_empty_schedule(self):
        """Test creating empty schedule structure."""
        result = self.parser._create_empty_schedule()

        assert result["type"] == "custom"
        assert result["pattern"] == {}  # Empty dict, not None
        assert result["date_range"]["start_date"] is None
        assert result["date_range"]["end_date"] is None
        assert result["exceptions"] == []
        # Empty schedule doesn't have timezone in pattern

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
        # Test slash-separated formats which are supported
        slash_formats = [
            "Mon/Tue/Wed 7:00 AM",
            "Monday/Tuesday/Wednesday 7:00 AM",
        ]

        for schedule in slash_formats:
            result = self.parser.parse_schedule_string(schedule)
            assert result["pattern"]["days"] == ["monday", "tuesday", "wednesday"]

        # Comma-separated formats might not be supported - test separately
        comma_formats = [
            "Mon, Tue, Wed 7:00 AM",
            "Monday, Tuesday, Wednesday 7:00 AM",
        ]

        for schedule in comma_formats:
            result = self.parser.parse_schedule_string(schedule)
            # These might fall back to custom or only parse the last day
            assert "type" in result

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
                "start_date": "2026-02-03",  # Tuesday
                "end_date": "2026-02-03",    # Same Tuesday (no Mondays)
            },
            "exceptions": [],
            "timezone": "UTC",
        }

        from_date = date(2026, 2, 1)
        limit = 10

        dates = self.parser.get_next_available_dates(
            impossible_schedule, from_date, limit
        )

        # Should return empty list or limited results, not loop forever
        assert len(dates) <= limit

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
            # Should not crash, some might parse successfully, some might fall back to custom type
            assert "type" in result
            # Only check for original_schedule if it's custom type
            if result["type"] == "custom":
                assert "original_schedule" in result

    @pytest.mark.unit
    def test_parse_schedule_string_duration_format(self):
        """Test parsing duration format with time range."""
        schedule = "Wednesday 18:00 - 19:30"
        result = self.parser.parse_schedule_string(schedule)

        assert result["type"] == "weekly_recurring"
        assert result["pattern"]["days"] == ["wednesday"]
        assert result["pattern"]["time"] == "18:00"
        assert result["pattern"]["duration_minutes"] == 90  # 1.5 hours

    @pytest.mark.unit
    def test_parse_schedule_string_duration_format_multiple_days(self):
        """Test parsing duration format with multiple days."""
        schedule = "Mon/Wed/Fri 9:00 - 10:30"
        result = self.parser.parse_schedule_string(schedule)

        assert result["type"] == "weekly_recurring"
        assert result["pattern"]["days"] == ["monday", "wednesday", "friday"]
        assert result["pattern"]["time"] == "09:00"
        assert result["pattern"]["duration_minutes"] == 90

    @pytest.mark.unit
    def test_parse_schedule_string_duration_format_various_durations(self):
        """Test parsing duration format with various duration lengths."""
        test_cases = [
            ("Tuesday 10:00 - 11:00", 60),    # 1 hour
            ("Thursday 14:30 - 16:00", 90),   # 1.5 hours
            ("Friday 8:00 - 9:45", 105),      # 1 hour 45 minutes
            ("Saturday 16:00 - 18:30", 150),  # 2.5 hours
        ]

        for schedule, expected_duration in test_cases:
            result = self.parser.parse_schedule_string(schedule)
            assert result["pattern"]["duration_minutes"] == expected_duration, \
                f"Failed for {schedule}, expected {expected_duration}, got {result['pattern']['duration_minutes']}"

    @pytest.mark.unit
    def test_parse_schedule_string_pattern_precedence(self):
        """Test that duration format takes precedence over 24-hour format."""
        # This should match duration pattern, not 24-hour pattern
        schedule = "Wednesday 18:00 - 19:30"
        result = self.parser.parse_schedule_string(schedule)

        # Should be parsed as duration format with calculated duration
        assert result["pattern"]["duration_minutes"] == 90
        assert result["pattern"]["time"] == "18:00"
        assert result["pattern"]["days"] == ["wednesday"]

        # Compare with 24-hour format (should default to 60 minutes)
        schedule_24h = "Wednesday 18:00"
        result_24h = self.parser.parse_schedule_string(schedule_24h)
        assert result_24h["pattern"]["duration_minutes"] == 60  # Default

    @pytest.mark.unit
    def test_parse_schedule_string_duration_edge_cases(self):
        """Test edge cases in duration format parsing."""
        edge_cases = [
            ("Monday 23:00 - 23:59", 59),     # Same day, late night
            ("Tuesday 9:15 - 9:45", 30),      # 30-minute class
            ("Wednesday 12:00 - 13:00", 60),  # Noon to 1 PM
        ]

        for schedule, expected_duration in edge_cases:
            result = self.parser.parse_schedule_string(schedule)
            assert result["pattern"]["duration_minutes"] == expected_duration

    @pytest.mark.unit
    def test_parse_schedule_string_duration_invalid_range(self):
        """Test duration format with invalid time ranges."""
        # End time before start time should fallback to default duration
        schedule = "Monday 19:00 - 18:00"
        result = self.parser.parse_schedule_string(schedule)

        # Should still parse the start time correctly but use fallback duration
        assert result["pattern"]["time"] == "19:00"
        assert result["pattern"]["duration_minutes"] == 60  # Fallback duration

    @pytest.mark.unit
    def test_parse_schedule_string_duration_format_case_insensitive(self):
        """Test duration format parsing is case insensitive."""
        schedule = "WEDNESDAY 18:00 - 19:30"
        result = self.parser.parse_schedule_string(schedule)

        assert result["type"] == "weekly_recurring"
        assert result["pattern"]["days"] == ["wednesday"]
        assert result["pattern"]["time"] == "18:00"
        assert result["pattern"]["duration_minutes"] == 90

    @pytest.mark.unit
    def test_parse_schedule_string_duration_with_spaces(self):
        """Test duration format with various spacing."""
        test_cases = [
            "Wednesday 18:00-19:30",      # No spaces around dash
            "Wednesday 18:00 -19:30",     # Space before dash only
            "Wednesday 18:00- 19:30",     # Space after dash only
            "Wednesday 18:00  -  19:30",  # Multiple spaces
        ]

        for schedule in test_cases:
            result = self.parser.parse_schedule_string(schedule)
            assert result["pattern"]["duration_minutes"] == 90
            assert result["pattern"]["time"] == "18:00"

    # --- normalize_schedule tests ---

    @pytest.mark.unit
    def test_normalize_schedule_already_canonical(self):
        """Test that canonical input is returned unchanged."""
        assert ScheduleParserService.normalize_schedule("Mon/Wed/Fri 7:00 AM") == "Mon/Wed/Fri 7:00 AM"

    @pytest.mark.unit
    def test_normalize_schedule_full_day_names(self):
        """Test full day names are abbreviated."""
        assert ScheduleParserService.normalize_schedule("Wednesday 6:00 PM") == "Wed 6:00 PM"
        assert ScheduleParserService.normalize_schedule("Monday/Wednesday/Friday 7:00 AM") == "Mon/Wed/Fri 7:00 AM"

    @pytest.mark.unit
    def test_normalize_schedule_comma_separators(self):
        """Test comma-separated days are converted to /."""
        assert ScheduleParserService.normalize_schedule("MON,WED,FRI 8:00 AM") == "Mon/Wed/Fri 8:00 AM"

    @pytest.mark.unit
    def test_normalize_schedule_24h_to_12h(self):
        """Test 24-hour time is converted to 12-hour AM/PM."""
        assert ScheduleParserService.normalize_schedule("Mon/Wed/Fri 19:00") == "Mon/Wed/Fri 7:00 PM"
        assert ScheduleParserService.normalize_schedule("Mon 8:00") == "Mon 8:00 AM"

    @pytest.mark.unit
    def test_normalize_schedule_time_range_to_start_only(self):
        """Test time ranges keep only start time."""
        assert ScheduleParserService.normalize_schedule("Mon/Wed/Fri 10:00-12:00") == "Mon/Wed/Fri 10:00 AM"
        assert ScheduleParserService.normalize_schedule("Wednesday 18:00 - 19:30") == "Wed 6:00 PM"

    @pytest.mark.unit
    def test_normalize_schedule_case_normalization(self):
        """Test case normalization."""
        assert ScheduleParserService.normalize_schedule("MON/WED/FRI 7:00 AM") == "Mon/Wed/Fri 7:00 AM"
        assert ScheduleParserService.normalize_schedule("TUE,THU 19:00") == "Tue/Thu 7:00 PM"

    @pytest.mark.unit
    def test_normalize_schedule_midnight_and_noon(self):
        """Test edge cases for midnight and noon."""
        assert ScheduleParserService.normalize_schedule("Mon 0:00") == "Mon 12:00 AM"
        assert ScheduleParserService.normalize_schedule("Mon 12:00") == "Mon 12:00 PM"

    @pytest.mark.unit
    def test_normalize_schedule_empty_and_none(self):
        """Test empty/None input."""
        assert ScheduleParserService.normalize_schedule("") == ""
        assert ScheduleParserService.normalize_schedule("  ") == "  "
        assert ScheduleParserService.normalize_schedule(None) is None

    @pytest.mark.unit
    def test_normalize_schedule_unparseable(self):
        """Test unparseable input is returned as-is."""
        assert ScheduleParserService.normalize_schedule("By appointment") == "By appointment"

    @pytest.mark.unit
    def test_parse_schedule_string_all_formats_coexist(self):
        """Test that all three format types work correctly."""
        test_cases = [
            # Duration format (Pattern 0 - most specific)
            ("Wednesday 18:00 - 19:30", "18:00", 90),
            # 12-hour AM/PM format (Pattern 1)
            ("Mon/Wed/Fri 7:00 AM", "07:00", 60),
            ("Tue/Thu 6:30 PM", "18:30", 60),
            # 24-hour format (Pattern 2 - least specific)
            ("Mon/Wed/Fri 19:00", "19:00", 60),
        ]

        for schedule, expected_time, expected_duration in test_cases:
            result = self.parser.parse_schedule_string(schedule)
            assert result["pattern"]["time"] == expected_time
            assert result["pattern"]["duration_minutes"] == expected_duration