# Generated manually for adding AI review, expected salary, and scoring fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('candidates', '0003_alter_education_relevant_courses_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='parsedresume',
            name='ai_review',
            field=models.TextField(blank=True, help_text="AI summary and review of candidate's qualifications"),
        ),
        migrations.AddField(
            model_name='parsedresume',
            name='expected_salary',
            field=models.CharField(blank=True, help_text="Expected salary from resume (e.g., '45 Million Toman / Month')", max_length=200),
        ),
        migrations.AddField(
            model_name='jobscore',
            name='experience_score',
            field=models.FloatField(blank=True, help_text='Experience score out of 100 (from scoring response)', null=True),
        ),
        migrations.AddField(
            model_name='jobscore',
            name='education_score',
            field=models.FloatField(blank=True, help_text='Education score out of 100 (from scoring response)', null=True),
        ),
    ]

