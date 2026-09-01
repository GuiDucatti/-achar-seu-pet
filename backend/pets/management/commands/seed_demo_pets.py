from datetime import date
from pathlib import Path
from shutil import copy2

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

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
        'caracteristicas': 'Pelagem volumosa e lingua azulada.',
        'cidade': 'Aracatuba', 'estado': 'SP', 'latitude': -21.2089,
        'longitude': -50.4328, 'data_desaparecimento': date(2026, 8, 27),
        'status': Pet.STATUS_PERDIDO,
    },
    {
        'nome': 'Lua', 'foto': 'lua.jpg', 'especie': 'gato',
        'raca': 'Sem raca definida', 'cor': 'Branca e cinza', 'sexo': 'femea',
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
        'raca': 'Sem raca definida', 'cor': 'Preta e branca', 'sexo': 'femea',
        'caracteristicas': 'Mancha branca no queixo e patas dianteiras claras.',
        'cidade': 'Penapolis', 'estado': 'SP', 'latitude': -21.4197,
        'longitude': -50.0775, 'data_desaparecimento': date(2026, 8, 20),
        'status': Pet.STATUS_PERDIDO,
    },
    {
        'nome': 'Frida', 'foto': 'frida.jpg', 'especie': 'gato',
        'raca': 'Sem raca definida', 'cor': 'Tigrada', 'sexo': 'femea',
        'caracteristicas': 'Orelha esquerda com pequena marca e coleira rosa.',
        'cidade': 'Birigui', 'estado': 'SP', 'latitude': -21.2810,
        'longitude': -50.3330, 'data_desaparecimento': date(2026, 8, 18),
        'status': Pet.STATUS_PERDIDO,
    },
    {
        'nome': 'Zeus', 'foto': 'zeus.jpg', 'especie': 'cachorro',
        'raca': 'Husky siberiano', 'cor': 'Cinza e branco', 'sexo': 'macho',
        'caracteristicas': 'Olhos azuis e mascara cinza no rosto.',
        'cidade': 'Birigui', 'estado': 'SP', 'latitude': -21.2950,
        'longitude': -50.3480, 'data_desaparecimento': date(2026, 8, 15),
        'status': Pet.STATUS_ENCONTRADO,
    },
    {
        'nome': 'Nina', 'foto': 'nina.jpg', 'especie': 'cachorro',
        'raca': 'Springer spaniel', 'cor': 'Branca e marrom', 'sexo': 'femea',
        'caracteristicas': 'Orelhas longas e coleira vermelha.',
        'cidade': 'Aracatuba', 'estado': 'SP', 'latitude': -21.2150,
        'longitude': -50.4400, 'data_desaparecimento': date(2026, 8, 12),
        'status': Pet.STATUS_ENCONTRADO,
    },
    {
        'nome': 'Salem', 'foto': 'salem.jpg', 'especie': 'gato',
        'raca': 'Sem raca definida', 'cor': 'Preto', 'sexo': 'macho',
        'caracteristicas': 'Olhos verdes e pequeno tufo branco no peito.',
        'cidade': 'Bilac', 'estado': 'SP', 'latitude': -21.3970,
        'longitude': -50.4680, 'data_desaparecimento': date(2026, 8, 10),
        'status': Pet.STATUS_ENCONTRADO,
    },
    {
        'nome': 'Bob', 'foto': 'bob.jpg', 'especie': 'cachorro',
        'raca': 'Spaniel japones', 'cor': 'Branco e preto', 'sexo': 'macho',
        'caracteristicas': 'Pequeno, focinho curto e pelagem macia.',
        'cidade': 'Coroados', 'estado': 'SP', 'latitude': -21.3500,
        'longitude': -50.2920, 'data_desaparecimento': date(2026, 8, 8),
        'status': Pet.STATUS_ENCONTRADO,
    },
)


class Command(BaseCommand):
    help = 'Cria ou atualiza os dez pets ficticios usados na demonstracao.'

    def handle(self, *args, **options):
        user, created = get_user_model().objects.get_or_create(
            username='demo-local',
            defaults={'email': 'demo-local@example.invalid'},
        )
        if created:
            user.set_unusable_password()
            user.save(update_fields=['password'])

        source_dir = Path(__file__).resolve().parents[2] / 'demo_assets'
        media_dir = Path(settings.MEDIA_ROOT) / 'demo'
        media_dir.mkdir(parents=True, exist_ok=True)

        created_count = 0
        updated_count = 0
        for item in DEMO_PETS:
            source_image = source_dir / item['foto']
            destination_image = media_dir / item['foto']
            copy2(source_image, destination_image)

            defaults = {
                **item,
                'foto': f"demo/{item['foto']}",
                'endereco_texto': f"Regiao central de {item['cidade']}",
                'raio_area_metros': 400,
                'descricao': (
                    f"Cadastro ficticio de {item['nome']} para demonstrar a busca regional."
                ),
                'contato': 'Nao disponivel',
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
                f'Demonstracao pronta: {created_count} criados, {updated_count} atualizados.'
            )
        )
