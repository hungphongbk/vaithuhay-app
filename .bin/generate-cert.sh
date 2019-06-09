#!/usr/bin/env bash
#Required
domain=$1
commonname=${domain}

#Change to your company details
country=VN
state="Ho Chi Minh City"
locality="Ho Chi Minh City"
organization=vaithuhay.com
organizationalunit=IT
email=buisontam@gmail.com

#Optional
#should have no password
password=vaithuhay

if [[ -z "$domain" ]]
then
    echo "Argument not present."
    echo "Useage $0 [common name]"

    exit 99
fi

echo "Generating key request for $domain"

cd .private

#Generate a key
openssl genrsa -des3 -passout pass:${password} -out ${domain}.key 2048

#Remove passphrase from the key. Comment the line out to keep the passphrase
echo "Removing passphrase from key"
openssl rsa -in ${domain}.key -passin pass:${password} -out ${domain}.key

#Create the request
echo "Creating CSR"
openssl req -new -key ${domain}.key -out ${domain}.csr -passin pass:${password} \
    -subj "/C=$country/ST=$state/L=$locality/O=$organization/OU=$organizationalunit/CN=$commonname/emailAddress=$email"

echo "Creating CRT"
openssl x509 -signkey ${domain}.key -in ${domain}.csr -req -days 365 -out ${domain}.crt

cd ../
