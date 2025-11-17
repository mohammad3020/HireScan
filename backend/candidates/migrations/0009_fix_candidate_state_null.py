# Generated manually to fix NULL state values

from django.db import migrations


def set_default_state(apps, schema_editor):
    """Set default state for candidates with NULL state"""
    Candidate = apps.get_model('candidates', 'Candidate')
    Candidate.objects.filter(state__isnull=True).update(state='shortlisted')
    # Also handle empty string
    Candidate.objects.filter(state='').update(state='shortlisted')


def reverse_set_default_state(apps, schema_editor):
    """Reverse migration - set state to NULL (not really needed but for completeness)"""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('candidates', '0008_add_category_to_jobscore'),
    ]

    operations = [
        migrations.RunPython(set_default_state, reverse_set_default_state),
    ]

