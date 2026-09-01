from rest_framework import permissions


class PetPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if view.action == 'create':
            return request.user and request.user.is_authenticated

        return True

    def has_object_permission(self, request, view, obj):
        if view.action == 'avistamentos':
            return True

        if request.method in permissions.SAFE_METHODS:
            return True

        return obj.autor == request.user
