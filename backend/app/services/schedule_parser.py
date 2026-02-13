import re
import json
from datetime import datetime, date, time, timedelta
from typing import Dict, List, Optional, Tuple
from zoneinfo import ZoneInfo


class ScheduleParserService:
    """
    Service for parsing schedule strings and managing class schedules.
    """

    # Day name mappings
    DAYS_MAP = {
        'monday': 0, 'mon': 0,
        'tuesday': 1, 'tue': 1, 'tues': 1,
        'wednesday': 2, 'wed': 2,
        'thursday': 3, 'thu': 3, 'thurs': 3,
        'friday': 4, 'fri': 4,
        'saturday': 5, 'sat': 5,
        'sunday': 6, 'sun': 6
    }

    def __init__(self, default_timezone: str = "America/New_York"):
        self.default_timezone = default_timezone

    def parse_schedule_string(self, schedule: str) -> Dict:
        """
        Convert schedule string like 'Mon/Wed/Fri 7:00 AM' to structured JSON.

        Args:
            schedule: Schedule string from class.schedule field

        Returns:
            Dict containing structured schedule data
        """
        if not schedule or not schedule.strip():
            return self._create_empty_schedule()

        schedule = schedule.strip().lower()

        # Pattern for "Mon/Wed/Fri 7:00 AM" or "Monday/Wednesday 9:30 PM"
        pattern = r'([a-z/]+)\s+(\d{1,2}):(\d{2})\s*(am|pm)'
        match = re.search(pattern, schedule)

        if not match:
            # If no pattern matches, return basic structure
            return self._create_basic_schedule(schedule)

        days_str, hour, minute, ampm = match.groups()

        # Parse days
        day_names = [day.strip() for day in days_str.split('/')]
        days = []

        for day_name in day_names:
            if day_name in self.DAYS_MAP:
                day_num = self.DAYS_MAP[day_name]
                days.append(self._get_day_name_from_number(day_num))

        if not days:
            return self._create_basic_schedule(schedule)

        # Convert to 24-hour format
        hour_24 = int(hour)
        if ampm == 'pm' and hour_24 != 12:
            hour_24 += 12
        elif ampm == 'am' and hour_24 == 12:
            hour_24 = 0

        time_str = f"{hour_24:02d}:{minute}"

        return {
            "type": "weekly_recurring",
            "pattern": {
                "days": days,
                "time": time_str,
                "duration_minutes": 60,  # Default duration
                "timezone": self.default_timezone
            },
            "date_range": {
                "start_date": date.today().isoformat(),
                "end_date": None
            },
            "exceptions": []
        }

    def validate_target_date(
        self,
        class_schedule: Dict,
        target_date: date,
        target_time: Optional[time] = None
    ) -> bool:
        """
        Check if target date/time is valid for class schedule.

        Args:
            class_schedule: Structured schedule data from schedule_data field
            target_date: Date user wants to attend
            target_time: Time user wants to attend (optional)

        Returns:
            True if target date/time is valid for this class
        """
        if not class_schedule or class_schedule.get("type") != "weekly_recurring":
            return True  # If no structured schedule, allow any date

        pattern = class_schedule.get("pattern", {})
        valid_days = pattern.get("days", [])

        if not valid_days:
            return True  # No day restrictions

        # Check if target date falls on a valid day
        target_weekday = target_date.weekday()
        target_day_name = self._get_day_name_from_number(target_weekday)

        if target_day_name.lower() not in [day.lower() for day in valid_days]:
            return False

        # Check date range
        date_range = class_schedule.get("date_range", {})
        start_date_str = date_range.get("start_date")
        end_date_str = date_range.get("end_date")

        if start_date_str:
            start_date = date.fromisoformat(start_date_str)
            if target_date < start_date:
                return False

        if end_date_str:
            end_date = date.fromisoformat(end_date_str)
            if target_date > end_date:
                return False

        # Check exceptions
        exceptions = class_schedule.get("exceptions", [])
        if target_date.isoformat() in exceptions:
            return False

        # If target_time is provided, validate it matches class time
        if target_time and pattern.get("time"):
            class_time_str = pattern["time"]
            class_time = time.fromisoformat(class_time_str)

            # Allow some flexibility (within 15 minutes)
            time_diff = abs(
                (datetime.combine(target_date, target_time) -
                 datetime.combine(target_date, class_time)).total_seconds()
            )

            if time_diff > 900:  # 15 minutes in seconds
                return False

        return True

    def get_next_available_dates(
        self,
        class_schedule: Dict,
        from_date: date = None,
        limit: int = 10
    ) -> List[datetime]:
        """
        Get upcoming class dates for display in frontend.

        Args:
            class_schedule: Structured schedule data
            from_date: Start date (defaults to today)
            limit: Maximum number of dates to return

        Returns:
            List of datetime objects representing upcoming class sessions
        """
        if from_date is None:
            from_date = date.today()

        if not class_schedule or class_schedule.get("type") != "weekly_recurring":
            return []

        pattern = class_schedule.get("pattern", {})
        valid_days = pattern.get("days", [])
        class_time_str = pattern.get("time", "09:00")
        timezone_str = pattern.get("timezone", self.default_timezone)

        if not valid_days:
            return []

        # Convert day names to weekday numbers
        valid_weekdays = []
        for day in valid_days:
            day_lower = day.lower()
            for name, num in self.DAYS_MAP.items():
                if name == day_lower:
                    valid_weekdays.append(num)
                    break

        if not valid_weekdays:
            return []

        # Parse class time
        try:
            class_time = time.fromisoformat(class_time_str)
        except ValueError:
            class_time = time(9, 0)  # Default to 9:00 AM

        # Generate upcoming dates
        available_dates = []
        current_date = from_date
        days_checked = 0
        max_days_to_check = limit * 10  # Prevent infinite loop

        # Get exceptions
        exceptions = set(class_schedule.get("exceptions", []))

        # Check date range
        date_range = class_schedule.get("date_range", {})
        end_date = None
        if date_range.get("end_date"):
            end_date = date.fromisoformat(date_range["end_date"])

        while len(available_dates) < limit and days_checked < max_days_to_check:
            if current_date.weekday() in valid_weekdays:
                # Check if date is not in exceptions
                if current_date.isoformat() not in exceptions:
                    # Check if within date range
                    if end_date is None or current_date <= end_date:
                        # Create datetime with timezone
                        try:
                            tz = ZoneInfo(timezone_str)
                        except:
                            tz = ZoneInfo(self.default_timezone)

                        session_datetime = datetime.combine(
                            current_date, class_time, tz
                        )
                        available_dates.append(session_datetime)

            current_date += timedelta(days=1)
            days_checked += 1

        return available_dates

    def _create_empty_schedule(self) -> Dict:
        """Create empty schedule structure."""
        return {
            "type": "custom",
            "pattern": {},
            "date_range": {
                "start_date": None,
                "end_date": None
            },
            "exceptions": []
        }

    def _create_basic_schedule(self, original_schedule: str) -> Dict:
        """Create basic schedule structure for unparseable schedules."""
        return {
            "type": "custom",
            "pattern": {
                "description": original_schedule
            },
            "date_range": {
                "start_date": date.today().isoformat(),
                "end_date": None
            },
            "exceptions": []
        }

    def _get_day_name_from_number(self, weekday: int) -> str:
        """Convert weekday number (0=Monday) to day name."""
        days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        return days[weekday] if 0 <= weekday <= 6 else 'monday'

    def schedule_to_user_friendly_string(self, class_schedule: Dict) -> str:
        """
        Convert structured schedule back to user-friendly string.

        Args:
            class_schedule: Structured schedule data

        Returns:
            Human-readable schedule string
        """
        if not class_schedule:
            return "Schedule not available"

        if class_schedule.get("type") == "weekly_recurring":
            pattern = class_schedule.get("pattern", {})
            days = pattern.get("days", [])
            time_str = pattern.get("time", "")

            if not days or not time_str:
                return "Schedule not available"

            # Format days
            if len(days) == 1:
                day_text = days[0].capitalize() + "s"
            else:
                day_text = ", ".join(day.capitalize() for day in days[:-1])
                if len(days) > 1:
                    day_text += f", and {days[-1].capitalize()}s"

            # Format time
            try:
                class_time = time.fromisoformat(time_str)
                time_formatted = class_time.strftime("%-I:%M %p")  # e.g., "7:00 AM"
            except ValueError:
                time_formatted = time_str

            return f"{day_text} at {time_formatted}"

        elif class_schedule.get("type") == "custom":
            description = class_schedule.get("pattern", {}).get("description", "")
            return description or "Schedule varies"

        return "Schedule not available"