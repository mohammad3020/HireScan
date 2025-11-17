# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('candidates', '0007_candidate_state'),
    ]

    operations = [
        migrations.AddField(
            model_name='jobscore',
            name='category',
            field=models.CharField(
                choices=[
                    ('shortlisted', 'Shortlisted'),
                    ('rejected', 'Rejected'),
                    ('interview_scheduled', 'Interview Scheduled'),
                    ('interviewed', 'Interviewed'),
                    ('offer_sent', 'Offer Sent'),
                    ('hired', 'Hired'),
                ],
                default='shortlisted',
                help_text='Candidate status/category for this job',
                max_length=20,
            ),
        ),
    ]

