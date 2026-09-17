from django.db import transaction
from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from .models import Pet


def _delete_photo_if_unreferenced(storage, name):
    if name and not Pet.objects.filter(foto=name).exists():
        storage.delete(name)


@receiver(pre_save, sender=Pet)
def remember_previous_photo(sender, instance, **kwargs):
    if not instance.pk:
        instance._previous_photo_name = None
        return

    instance._previous_photo_name = (
        sender.objects.filter(pk=instance.pk).values_list('foto', flat=True).first()
    )


@receiver(post_save, sender=Pet)
def delete_replaced_photo(sender, instance, **kwargs):
    previous_name = getattr(instance, '_previous_photo_name', None)
    current_name = instance.foto.name if instance.foto else None
    if not previous_name or previous_name == current_name:
        return

    storage = instance.foto.storage
    transaction.on_commit(
        lambda: _delete_photo_if_unreferenced(storage, previous_name)
    )


@receiver(post_delete, sender=Pet)
def delete_removed_pet_photo(sender, instance, **kwargs):
    if not instance.foto:
        return

    storage = instance.foto.storage
    photo_name = instance.foto.name
    transaction.on_commit(
        lambda: _delete_photo_if_unreferenced(storage, photo_name)
    )
