from datetime import date
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.files import File
from django.core.management.base import BaseCommand
from django.core.files.storage import default_storage

from pets.models import Pet


DEMO_PETS = (
    {
        'nome': 'Thor', 'foto': 'thor.jpg', 'especie': 'cachorro',
        'raca': 'Bullmastiff', 'cor': 'Caramelo', 'sexo': 'macho',
        'caracteristicas': 'Grande, focinho escuro e coleira azul.',
        'cidade': 'Birigui', 'estado': 'SP', 'latitude': -21.2886,
        'longitude': -50.3404, 'data_desaparecimento': date(2026, 8, 29),
        'status': Pet.STATUS_PERDIDO,
    },
    {
        'nome': 'Mel', 'foto': 'mel.jpg', 'especie': 'cachorro',
        'raca': 'Chow-chow', 'cor': 'Caramelo', 'sexo': 'femea',
        'caracteristicas': 'Pelagem volumosa e língua azulada.',
        'cidade': 'Araçatuba', 'estado': 'SP', 'latitude': -21.2089,
        'longitude': -50.4328, 'data_desaparecimento': date(2026, 8, 27),
        'status': Pet.STATUS_PERDIDO,
    },
    {
        'nome': 'Lua', 'foto': 'lua.jpg', 'especie': 'gato',
        'raca': 'Sem raça definida', 'cor': 'Branca e cinza', 'sexo': 'femea',
        'caracteristicas': 'Pequena, olhos claros e ponta da cauda escura.',
        'cidade': 'Bilac', 'estado': 'SP', 'latitude': -21.4040,
        'longitude': -50.4746, 'data_desaparecimento': date(2026, 8, 25),
        'status': Pet.STATUS_PERDIDO,
    },
    {
        'nome': 'Chico', 'foto': 'chico.jpg', 'especie': 'cachorro',
        'raca': 'Pastor de Shetland', 'cor': 'Tricolor', 'sexo': 'macho',
        'caracteristicas': 'Pelagem longa e mancha branca no peito.',
        'cidade': 'Coroados', 'estado': 'SP', 'latitude': -21.3570,
        'longitude': -50.2869, 'data_desaparecimento': date(2026, 8, 22),
        'status': Pet.STATUS_PERDIDO,
    },
    {
        'nome': 'Amora', 'foto': 'amora.jpg', 'especie': 'gato',
        'raca': 'Sem raça definida', 'cor': 'Preta e branca', 'sexo': 'femea',
        'caracteristicas': 'Mancha branca no queixo e patas dianteiras claras.',
        'cidade': 'Penápolis', 'estado': 'SP', 'latitude': -21.4197,
        'longitude': -50.0775, 'data_desaparecimento': date(2026, 8, 20),
        'status': Pet.STATUS_PERDIDO,
    },
    {
        'nome': 'Frida', 'foto': 'frida.jpg', 'especie': 'gato',
        'raca': 'Sem raça definida', 'cor': 'Tigrada', 'sexo': 'femea',
        'caracteristicas': 'Orelha esquerda com pequena marca e coleira rosa.',
        'cidade': 'Birigui', 'estado': 'SP', 'latitude': -21.2810,
        'longitude': -50.3330, 'data_desaparecimento': date(2026, 8, 18),
        'status': Pet.STATUS_PERDIDO,
    },
    {
        'nome': 'Zeus', 'foto': 'zeus.jpg', 'especie': 'cachorro',
        'raca': 'Husky siberiano', 'cor': 'Cinza e branco', 'sexo': 'macho',
        'caracteristicas': 'Olhos azuis e máscara cinza no rosto.',
        'cidade': 'Birigui', 'estado': 'SP', 'latitude': -21.2950,
        'longitude': -50.3480, 'data_desaparecimento': date(2026, 8, 15),
        'status': Pet.STATUS_ENCONTRADO,
    },
    {
        'nome': 'Nina', 'foto': 'nina.jpg', 'especie': 'cachorro',
        'raca': 'Springer spaniel', 'cor': 'Branca e marrom', 'sexo': 'femea',
        'caracteristicas': 'Orelhas longas e coleira vermelha.',
        'cidade': 'Araçatuba', 'estado': 'SP', 'latitude': -21.2150,
        'longitude': -50.4400, 'data_desaparecimento': date(2026, 8, 12),
        'status': Pet.STATUS_ENCONTRADO,
    },
    {
        'nome': 'Salem', 'foto': 'salem.jpg', 'especie': 'gato',
        'raca': 'Sem raça definida', 'cor': 'Preto', 'sexo': 'macho',
        'caracteristicas': 'Olhos verdes e pequeno tufo branco no peito.',
        'cidade': 'Bilac', 'estado': 'SP', 'latitude': -21.3970,
        'longitude': -50.4680, 'data_desaparecimento': date(2026, 8, 10),
        'status': Pet.STATUS_ENCONTRADO,
    },
    {
        'nome': 'Bob', 'foto': 'bob.jpg', 'especie': 'cachorro',
        'raca': 'Spaniel japonês', 'cor': 'Branco e preto', 'sexo': 'macho',
        'caracteristicas': 'Pequeno, focinho curto e pelagem macia.',
        'cidade': 'Coroados', 'estado': 'SP', 'latitude': -21.3500,
        'longitude': -50.2920, 'data_desaparecimento': date(2026, 8, 8),
        'status': Pet.STATUS_ENCONTRADO,
    },
)


class Command(BaseCommand):
    help = 'Cria ou atualiza os dez pets fictícios usados na demonstração.'

    def handle(self, *args, **options):
        user, created = get_user_model().objects.get_or_create(
            username='demo-local',
            defaults={'email': 'demo-local@example.invalid'},
        )
        if created:
            user.set_unusable_password()
            user.save(update_fields=['password'])

        source_dir = Path(__file__).resolve().parents[2] / 'demo_assets'

        created_count = 0
        updated_count = 0
        for item in DEMO_PETS:
            source_image = source_dir / item['foto']
            requested_name = f"demo/{item['foto']}"
            if default_storage.exists(requested_name):
                stored_name = requested_name
            else:
                with source_image.open('rb') as image_file:
                    stored_name = default_storage.save(requested_name, File(image_file))

            defaults = {
                **item,
                'foto': stored_name,
                'endereco_texto': f"Região central de {item['cidade']}",
                'raio_area_metros': 400,
                'descricao': (
                    f"Cadastro fictício de {item['nome']} para demonstrar a busca regional."
                ),
                'contato': 'Não disponível',
                'is_demo': True,
            }
            defaults.pop('nome')

            _, was_created = Pet.objects.update_or_create(
                autor=user,
                nome=item['nome'],
                defaults=defaults,
            )
            created_count += int(was_created)
            updated_count += int(not was_created)

        self.stdout.write(
            self.style.SUCCESS(
                f'Demonstração pronta: {created_count} criados, {updated_count} atualizados.'
            )
        )
