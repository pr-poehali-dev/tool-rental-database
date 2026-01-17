import json
import os
import psycopg2
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''API для управления арендой оборудования - получение каталога, создание заказов, работа с клиентами'''
    
    method = event.get('httpMethod', 'GET')
    path = event.get('queryStringParameters', {}).get('path', '')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        if method == 'GET':
            if path == 'equipment':
                category = event.get('queryStringParameters', {}).get('category', '')
                search = event.get('queryStringParameters', {}).get('search', '')
                
                query = f"SELECT id, name, category, price, period, status, image, specs FROM {os.environ['MAIN_DB_SCHEMA']}.equipment WHERE 1=1"
                params = []
                
                if category and category != 'all':
                    query += " AND category = %s"
                    params.append(category)
                
                if search:
                    query += " AND name ILIKE %s"
                    params.append(f'%{search}%')
                
                query += " ORDER BY id"
                
                if params:
                    cur.execute(query, params)
                else:
                    cur.execute(query)
                
                rows = cur.fetchall()
                equipment = []
                for row in rows:
                    equipment.append({
                        'id': row[0],
                        'name': row[1],
                        'category': row[2],
                        'price': row[3],
                        'period': row[4],
                        'status': row[5],
                        'image': row[6],
                        'specs': row[7] if row[7] else []
                    })
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps(equipment, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            elif path == 'orders':
                cur.execute(f"SELECT id, equipment_name, start_date, end_date, status, total, contract_number FROM {os.environ['MAIN_DB_SCHEMA']}.orders ORDER BY created_at DESC")
                rows = cur.fetchall()
                orders = []
                for row in rows:
                    orders.append({
                        'id': row[0],
                        'equipment': row[1],
                        'startDate': row[2].isoformat() if row[2] else '',
                        'endDate': row[3].isoformat() if row[3] else '',
                        'status': row[4],
                        'total': row[5],
                        'contractNumber': row[6]
                    })
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps(orders, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            elif path == 'client':
                cur.execute(f"SELECT company_name, inn, kpp, legal_address, contact_person, phone, email, bank_name, account_number, correspondent_account, bik FROM {os.environ['MAIN_DB_SCHEMA']}.clients LIMIT 1")
                row = cur.fetchone()
                
                if row:
                    client = {
                        'companyName': row[0],
                        'inn': row[1],
                        'kpp': row[2],
                        'legalAddress': row[3],
                        'contactPerson': row[4],
                        'phone': row[5],
                        'email': row[6],
                        'bankName': row[7],
                        'accountNumber': row[8],
                        'correspondentAccount': row[9],
                        'bik': row[10]
                    }
                else:
                    client = {}
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps(client, ensure_ascii=False),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            if path == 'order':
                body = json.loads(event.get('body', '{}'))
                equipment_ids = body.get('equipmentIds', [])
                start_date = body.get('startDate', '')
                end_date = body.get('endDate', '')
                
                contract_number = f"А-{datetime.now().year}-{datetime.now().strftime('%m%d%H%M%S')}"
                
                for eq_id in equipment_ids:
                    cur.execute(f"SELECT name, price FROM {os.environ['MAIN_DB_SCHEMA']}.equipment WHERE id = %s", (eq_id,))
                    eq_row = cur.fetchone()
                    
                    if eq_row:
                        cur.execute(
                            f"INSERT INTO {os.environ['MAIN_DB_SCHEMA']}.orders (equipment_id, equipment_name, start_date, end_date, status, total, contract_number) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                            (eq_id, eq_row[0], start_date, end_date, 'pending', eq_row[1], contract_number)
                        )
                
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 201,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'contractNumber': contract_number}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            elif path == 'client':
                body = json.loads(event.get('body', '{}'))
                
                cur.execute(f"SELECT id FROM {os.environ['MAIN_DB_SCHEMA']}.clients LIMIT 1")
                existing = cur.fetchone()
                
                if existing:
                    cur.execute(
                        f"UPDATE {os.environ['MAIN_DB_SCHEMA']}.clients SET company_name = %s, inn = %s, kpp = %s, legal_address = %s, contact_person = %s, phone = %s, email = %s, bank_name = %s, account_number = %s, correspondent_account = %s, bik = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                        (body.get('companyName'), body.get('inn'), body.get('kpp'), body.get('legalAddress'), 
                         body.get('contactPerson'), body.get('phone'), body.get('email'), body.get('bankName'),
                         body.get('accountNumber'), body.get('correspondentAccount'), body.get('bik'), existing[0])
                    )
                else:
                    cur.execute(
                        f"INSERT INTO {os.environ['MAIN_DB_SCHEMA']}.clients (company_name, inn, kpp, legal_address, contact_person, phone, email, bank_name, account_number, correspondent_account, bik) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                        (body.get('companyName'), body.get('inn'), body.get('kpp'), body.get('legalAddress'),
                         body.get('contactPerson'), body.get('phone'), body.get('email'), body.get('bankName'),
                         body.get('accountNumber'), body.get('correspondentAccount'), body.get('bik'))
                    )
                
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'success': True}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 404,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Not found'}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)}, ensure_ascii=False),
            'isBase64Encoded': False
        }
