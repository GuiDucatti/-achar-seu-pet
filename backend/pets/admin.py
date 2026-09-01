from django.contrib import admin

from .models import Avistamento, Pet


@admin.register(Pet)
class PetAdmin(admin.ModelAdmin):
    list_display = (
        'nome',
        'especie',
        'status',
        'cidade',
        'estado',
        'autor',
        'criado_em',
    )
    list_filter = ('status', 'especie', 'sexo', 'estado', 'criado_em')
    search_fields = ('nome', 'raca', 'cor', 'cidade', 'estado')
    readonly_fields = ('criado_em', 'atualizado_em')


@admin.register(Avistamento)
class AvistamentoAdmin(admin.ModelAdmin):
    list_display = ('pet', 'latitude', 'longitude', 'criado_em')
    search_fields = ('pet__nome', 'descricao', 'contato_quem_viu')
    readonly_fields = ('criado_em',)
