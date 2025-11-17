from copy import copy as shallow_copy

from django.apps import AppConfig


def _patch_django_template_context_copy():
    """
    Django 4.2's BaseContext.__copy__ uses copy(super()) which breaks on Python 3.14.
    Patch it to use a safer object copy until Django officially supports 3.14.
    """
    from django.template import context as django_context

    original_base_copy = getattr(django_context.BaseContext, "__copy__", None)

    def basecontext_copy(self):
        duplicate = object.__new__(self.__class__)
        duplicate.__dict__ = self.__dict__.copy()
        duplicate.dicts = self.dicts[:]
        return duplicate

    def context_copy(self):
        duplicate = basecontext_copy(self)
        if hasattr(self, "render_context"):
            duplicate.render_context = shallow_copy(self.render_context)
        return duplicate

    django_context.BaseContext.__copy__ = basecontext_copy
    django_context.Context.__copy__ = context_copy
    return original_base_copy


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        _patch_django_template_context_copy()
