# Generated by Django 5.2.3 on 2025-07-13 23:06

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("main_app", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="art",
            name="height",
            field=models.IntegerField(default=64),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="art",
            name="width",
            field=models.IntegerField(default=64),
            preserve_default=False,
        ),
    ]
