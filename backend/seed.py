"""Seed the database with sample data."""

import asyncio
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session, engine
from app.models.yoga_type import Base, YogaType
from app.models.teacher import Teacher
from app.models.yoga_class import YogaClass


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        session: AsyncSession

        # Yoga types
        vinyasa = YogaType(
            id=uuid.uuid4(),
            name_en="Vinyasa Flow",
            name_zh="流瑜伽",
            description_en="A dynamic style of yoga that links breath with movement in a flowing sequence.",
            description_zh="一种将呼吸与动作串联起来的动态瑜伽风格。",
        )
        hatha = YogaType(
            id=uuid.uuid4(),
            name_en="Hatha Yoga",
            name_zh="哈达瑜伽",
            description_en="A gentle introduction to basic yoga postures, focusing on alignment and breath.",
            description_zh="温和地介绍基础瑜伽体式，注重对齐和呼吸。",
        )
        session.add_all([vinyasa, hatha])

        # Teachers
        teacher1 = Teacher(
            id=uuid.uuid4(),
            name_en="Sarah Chen",
            name_zh="陈莎拉",
            bio_en="Sarah has been teaching yoga for over 10 years, specializing in Vinyasa and restorative practices.",
            bio_zh="莎拉拥有超过10年的瑜伽教学经验，专注于流瑜伽和修复性练习。",
            qualifications="RYT-500, E-RYT-200",
        )
        teacher2 = Teacher(
            id=uuid.uuid4(),
            name_en="Li Wei",
            name_zh="李伟",
            bio_en="Li Wei brings a mindful approach to Hatha yoga, emphasizing inner peace and flexibility.",
            bio_zh="李伟以正念的方式教授哈达瑜伽，强调内心平和与柔韧性。",
            qualifications="RYT-200, Yin Yoga Certified",
        )
        session.add_all([teacher1, teacher2])

        # Classes
        class1 = YogaClass(
            id=uuid.uuid4(),
            name_en="Morning Vinyasa Flow",
            name_zh="晨间流瑜伽",
            description_en="Start your day with an energizing Vinyasa flow sequence suitable for all levels.",
            description_zh="以充满活力的流瑜伽序列开始新的一天，适合所有水平。",
            teacher_id=teacher1.id,
            yoga_type_id=vinyasa.id,
            schedule="Mon/Wed/Fri 7:00 AM",
            duration_minutes=60,
            difficulty="beginner",
            capacity=20,
            location="Serenity Studio, 123 Lotus Lane, Suite 4B",
        )
        class2 = YogaClass(
            id=uuid.uuid4(),
            name_en="Evening Hatha Relaxation",
            name_zh="傍晚哈达放松",
            description_en="Wind down with gentle Hatha poses and deep breathing to release the day's tension.",
            description_zh="通过温和的哈达体式和深呼吸来释放一天的紧张。",
            teacher_id=teacher2.id,
            yoga_type_id=hatha.id,
            schedule="Tue/Thu 6:30 PM",
            duration_minutes=75,
            difficulty="beginner",
            capacity=15,
            location="Harmony Wellness Center, 456 Bamboo Ave",
        )
        session.add_all([class1, class2])

        await session.commit()
        print("Seed data inserted successfully!")


if __name__ == "__main__":
    asyncio.run(seed())
