# Some common definitions for the SSL and SSL record-layer analyzers.

type uint24 = record {
	byte1 : uint8;
	byte2 : uint8;
	byte3 : uint8;
};

type uint48 = record {
	byte1 : uint8;
	byte2 : uint8;
	byte3 : uint8;
	byte4 : uint8;
	byte5 : uint8;
	byte6 : uint8;
};


%header{
	string orig_label(bool is_orig);
	%}


%code{
string orig_label(bool is_orig)
		{
		return string(is_orig ? "originator" :"responder");
		}
%}

%header{
	class to_int {
	public:
		int operator()(uint24 * num) const
		{
		return (num->byte1() << 16) | (num->byte2() << 8) | num->byte3();
		}

		uint64 operator()(uint48 * num) const
		{
		return ((uint64)num->byte1() << 40) | ((uint64)num->byte2() << 32) | ((uint64)num->byte3() << 24) |
		  ((uint64)num->byte4() << 16) | ((uint64)num->byte5() << 8) | (uint64)num->byte6();
		}
	};

	string state_label(int state_nr);
%}

extern type to_int;

function to_string_val(data : uint8[]) : zeek::StringVal
	%{
	char tmp[32];
	memset(tmp, 0, sizeof(tmp));

	// Just return an empty string if the string is longer than 32 bytes
	if ( data && data->size() <= 32 )
		{
		for ( unsigned int i = data->size(); i > 0; --i )
			tmp[i-1] = (*data)[i-1];
		}

	return new zeek::StringVal(32, tmp);
	%}

function version_ok(vers : uint16) : bool
	%{
	if ( vers >> 8 == 0x7F ) // 1.3 draft
		return true;

	switch ( vers ) {
	case SSLv20:
	case SSLv30:
	case TLSv10:
	case TLSv11:
	case TLSv12:
	case TLSv13:
	case DTLSv10:
	case DTLSv12:
	case DTLSv13:
		return true;

	default:
		return false;
	}
	%}


%extern{
#include <string>
#include "zeek/analyzer/protocol/ssl/events.bif.h"

using std::string;
%}

# a maximum of 100k for one record seems safe
let MAX_DTLS_HANDSHAKE_RECORD: uint32 = 100000;

enum ContentType {
	CHANGE_CIPHER_SPEC = 20,
	ALERT = 21,
	HANDSHAKE = 22,
	APPLICATION_DATA = 23,
	HEARTBEAT = 24,
	V2_ERROR = 300,
	V2_CLIENT_HELLO = 301,
	V2_CLIENT_MASTER_KEY = 302,
	V2_SERVER_HELLO = 304,
	UNKNOWN_OR_V2_ENCRYPTED = 400
};

# If you add a new TLS version here, do not forget to also adjust the DPD signature.
enum SSLVersions {
	UNKNOWN_VERSION	= 0x0000,
	SSLv20		= 0x0002,
	SSLv30		= 0x0300,
	TLSv10		= 0x0301,
	TLSv11		= 0x0302,
	TLSv12		= 0x0303,
	TLSv13		= 0x0304,
	TLSv13_draft	= 0x7F00, # the second byte actually defines the draft.

	DTLSv10   = 0xFEFF,
	# DTLSv11 does not exist.
	DTLSv12   = 0xFEFD,
	DTLSv13   = 0xFEFC
};

enum SSLExtensions {
	EXT_SERVER_NAME = 0,
	EXT_MAX_FRAGMENT_LENGTH = 1,
	EXT_CLIENT_CERTIFICATE_URL = 2,
	EXT_TRUSTED_CA_KEYS = 3,
	EXT_TRUNCATED_HMAC = 4,
	EXT_STATUS_REQUEST = 5,
	EXT_USER_MAPPING = 6,
	EXT_CLIENT_AUTHZ = 7,
	EXT_SERVER_AUTHZ = 8,
	EXT_CERT_TYPE = 9,
	EXT_ELLIPTIC_CURVES = 10,
	EXT_EC_POINT_FORMATS = 11,
	EXT_SRP = 12,
	EXT_SIGNATURE_ALGORITHMS = 13,
	EXT_USE_SRTP = 14,
	EXT_HEARTBEAT = 15,
	EXT_APPLICATION_LAYER_PROTOCOL_NEGOTIATION = 16,
	EXT_STATUS_REQUEST_V2 = 17,
	EXT_SIGNED_CERTIFICATE_TIMESTAMP = 18,
	EXT_SESSIONTICKET_TLS = 35,
	EXT_KEY_SHARE_OLD = 40,
	EXT_PRE_SHARED_KEY = 41,
	EXT_EARLY_DATA = 42,
	EXT_SUPPORTED_VERSIONS = 43,
	EXT_COOKIE = 44,
	EXT_PSK_KEY_EXCHANGE_MODES = 45,
	EXT_TICKET_EARLY_DATA_INFO = 46,
	EXT_CERTIFICATE_AUTHORITIES = 47,
	EXT_OID_FILTERS = 48,
	EXT_KEY_SHARE = 51,
	EXT_CONNECTION_ID = 54,
	EXT_NEXT_PROTOCOL_NEGOTIATION = 13172,
	EXT_ORIGIN_BOUND_CERTIFICATES = 13175,
	EXT_ENCRYPTED_CLIENT_CERTIFICATES = 13180,
	EXT_CHANNEL_ID = 30031,
	EXT_CHANNEL_ID_NEW = 30032,
	EXT_PADDING = 35655,
	EXT_RENEGOTIATION_INFO = 65281
};

enum ECCurveType {
	EXPLICIT_PRIME = 1,
	EXPLICIT_CHAR = 2,
	NAMED_CURVE = 3
};

enum TLSCiphers {
	NO_CHOSEN_CIPHER = 0xFFFFFF,
	TLS_NULL_WITH_NULL_NULL = 0x0000,
	TLS_RSA_WITH_NULL_MD5 = 0x0001,
	TLS_RSA_WITH_NULL_SHA = 0x0002,
	TLS_RSA_EXPORT_WITH_RC4_40_MD5 = 0x0003,
	TLS_RSA_WITH_RC4_128_MD5 = 0x0004,
	TLS_RSA_WITH_RC4_128_SHA = 0x0005,
	TLS_RSA_EXPORT_WITH_RC2_CBC_40_MD5 = 0x0006,
	TLS_RSA_WITH_IDEA_CBC_SHA = 0x0007,
	TLS_RSA_EXPORT_WITH_DES40_CBC_SHA = 0x0008,
	TLS_RSA_WITH_DES_CBC_SHA = 0x0009,
	TLS_RSA_WITH_3DES_EDE_CBC_SHA = 0x000A,
	TLS_DH_DSS_EXPORT_WITH_DES40_CBC_SHA = 0x000B,
	TLS_DH_DSS_WITH_DES_CBC_SHA = 0x000C,
	TLS_DH_DSS_WITH_3DES_EDE_CBC_SHA = 0x000D,
	TLS_DH_RSA_EXPORT_WITH_DES40_CBC_SHA = 0x000E,
	TLS_DH_RSA_WITH_DES_CBC_SHA = 0x000F,
	TLS_DH_RSA_WITH_3DES_EDE_CBC_SHA = 0x0010,
	TLS_DHE_DSS_EXPORT_WITH_DES40_CBC_SHA = 0x0011,
	TLS_DHE_DSS_WITH_DES_CBC_SHA = 0x0012,
	TLS_DHE_DSS_WITH_3DES_EDE_CBC_SHA = 0x0013,
	TLS_DHE_RSA_EXPORT_WITH_DES40_CBC_SHA = 0x0014,
	TLS_DHE_RSA_WITH_DES_CBC_SHA = 0x0015,
	TLS_DHE_RSA_WITH_3DES_EDE_CBC_SHA = 0x0016,
	TLS_DH_ANON_EXPORT_WITH_RC4_40_MD5 = 0x0017,
	TLS_DH_ANON_WITH_RC4_128_MD5 = 0x0018,
	TLS_DH_ANON_EXPORT_WITH_DES40_CBC_SHA = 0x0019,
	TLS_DH_ANON_WITH_DES_CBC_SHA = 0x001A,
	TLS_DH_ANON_WITH_3DES_EDE_CBC_SHA = 0x001B,
	TLS_KRB5_WITH_DES_CBC_SHA = 0x001E,
	TLS_KRB5_WITH_3DES_EDE_CBC_SHA = 0x001F,
	TLS_KRB5_WITH_RC4_128_SHA = 0x0020,
	TLS_KRB5_WITH_IDEA_CBC_SHA = 0x0021,
	TLS_KRB5_WITH_DES_CBC_MD5 = 0x0022,
	TLS_KRB5_WITH_3DES_EDE_CBC_MD5 = 0x0023,
	TLS_KRB5_WITH_RC4_128_MD5 = 0x0024,
	TLS_KRB5_WITH_IDEA_CBC_MD5 = 0x0025,
	TLS_KRB5_EXPORT_WITH_DES_CBC_40_SHA = 0x0026,
	TLS_KRB5_EXPORT_WITH_RC2_CBC_40_SHA = 0x0027,
	TLS_KRB5_EXPORT_WITH_RC4_40_SHA = 0x0028,
	TLS_KRB5_EXPORT_WITH_DES_CBC_40_MD5 = 0x0029,
	TLS_KRB5_EXPORT_WITH_RC2_CBC_40_MD5 = 0x002A,
	TLS_KRB5_EXPORT_WITH_RC4_40_MD5 = 0x002B,
	TLS_RSA_WITH_AES_128_CBC_SHA = 0x002F,
	TLS_DH_DSS_WITH_AES_128_CBC_SHA = 0x0030,
	TLS_DH_RSA_WITH_AES_128_CBC_SHA = 0x0031,
	TLS_DHE_DSS_WITH_AES_128_CBC_SHA = 0x0032,
	TLS_DHE_RSA_WITH_AES_128_CBC_SHA = 0x0033,
	TLS_DH_ANON_WITH_AES_128_CBC_SHA = 0x0034,
	TLS_RSA_WITH_AES_256_CBC_SHA = 0x0035,
	TLS_DH_DSS_WITH_AES_256_CBC_SHA = 0x0036,
	TLS_DH_RSA_WITH_AES_256_CBC_SHA = 0x0037,
	TLS_DHE_DSS_WITH_AES_256_CBC_SHA = 0x0038,
	TLS_DHE_RSA_WITH_AES_256_CBC_SHA = 0x0039,
	TLS_DH_ANON_WITH_AES_256_CBC_SHA = 0x003A,
	TLS_RSA_WITH_NULL_SHA256 = 0x003B,
	TLS_RSA_WITH_AES_128_CBC_SHA256 = 0x003C,
	TLS_RSA_WITH_AES_256_CBC_SHA256 = 0x003D,
	TLS_DH_DSS_WITH_AES_128_CBC_SHA256 = 0x003E,
	TLS_DH_RSA_WITH_AES_128_CBC_SHA256 = 0x003F,
	TLS_DHE_DSS_WITH_AES_128_CBC_SHA256 = 0x0040,
	TLS_RSA_WITH_CAMELLIA_128_CBC_SHA = 0x0041,
	TLS_DH_DSS_WITH_CAMELLIA_128_CBC_SHA = 0x0042,
	TLS_DH_RSA_WITH_CAMELLIA_128_CBC_SHA = 0x0043,
	TLS_DHE_DSS_WITH_CAMELLIA_128_CBC_SHA = 0x0044,
	TLS_DHE_RSA_WITH_CAMELLIA_128_CBC_SHA = 0x0045,
	TLS_DH_ANON_WITH_CAMELLIA_128_CBC_SHA = 0x0046,
	TLS_RSA_EXPORT1024_WITH_RC4_56_MD5 = 0x0060,
	TLS_RSA_EXPORT1024_WITH_RC2_CBC_56_MD5 = 0x0061,
	TLS_RSA_EXPORT1024_WITH_DES_CBC_SHA = 0x0062,
	TLS_DHE_DSS_EXPORT1024_WITH_DES_CBC_SHA = 0x0063,
	TLS_RSA_EXPORT1024_WITH_RC4_56_SHA = 0x0064,
	TLS_DHE_DSS_EXPORT1024_WITH_RC4_56_SHA = 0x0065,
	TLS_DHE_DSS_WITH_RC4_128_SHA = 0x0066,
	TLS_DHE_RSA_WITH_AES_128_CBC_SHA256 = 0x0067,
	TLS_DH_DSS_WITH_AES_256_CBC_SHA256 = 0x0068,
	TLS_DH_RSA_WITH_AES_256_CBC_SHA256 = 0x0069,
	TLS_DHE_DSS_WITH_AES_256_CBC_SHA256 = 0x006A,
	TLS_DHE_RSA_WITH_AES_256_CBC_SHA256 = 0x006B,
	TLS_DH_ANON_WITH_AES_128_CBC_SHA256 = 0x006C,
	TLS_DH_ANON_WITH_AES_256_CBC_SHA256 = 0x006D,
	# draft-ietf-tls-openpgp-keys-06
	TLS_DHE_DSS_WITH_3DES_EDE_CBC_RMD = 0x0072,
	TLS_DHE_DSS_WITH_AES_128_CBC_RMD = 0x0073,
	TLS_DHE_DSS_WITH_AES_256_CBC_RMD = 0x0074,
	TLS_DHE_RSA_WITH_3DES_EDE_CBC_RMD = 0x0077,
	TLS_DHE_RSA_WITH_AES_128_CBC_RMD = 0x0078,
	TLS_DHE_RSA_WITH_AES_256_CBC_RMD = 0x0079,
	TLS_RSA_WITH_3DES_EDE_CBC_RMD = 0x007C,
	TLS_RSA_WITH_AES_128_CBC_RMD = 0x007D,
	TLS_RSA_WITH_AES_256_CBC_RMD = 0x007E,
	# draft-chudov-cryptopro-cptls-04
	TLS_GOSTR341094_WITH_28147_CNT_IMIT = 0x0080,
	TLS_GOSTR341001_WITH_28147_CNT_IMIT = 0x0081,
	TLS_GOSTR341094_WITH_NULL_GOSTR3411 = 0x0082,
	TLS_GOSTR341001_WITH_NULL_GOSTR3411 = 0x0083,
	TLS_RSA_WITH_CAMELLIA_256_CBC_SHA = 0x0084,
	TLS_DH_DSS_WITH_CAMELLIA_256_CBC_SHA = 0x0085,
	TLS_DH_RSA_WITH_CAMELLIA_256_CBC_SHA = 0x0086,
	TLS_DHE_DSS_WITH_CAMELLIA_256_CBC_SHA = 0x0087,
	TLS_DHE_RSA_WITH_CAMELLIA_256_CBC_SHA = 0x0088,
	TLS_DH_ANON_WITH_CAMELLIA_256_CBC_SHA = 0x0089,
	TLS_PSK_WITH_RC4_128_SHA = 0x008A,
	TLS_PSK_WITH_3DES_EDE_CBC_SHA = 0x008B,
	TLS_PSK_WITH_AES_128_CBC_SHA = 0x008C,
	TLS_PSK_WITH_AES_256_CBC_SHA = 0x008D,
	TLS_DHE_PSK_WITH_RC4_128_SHA = 0x008E,
	TLS_DHE_PSK_WITH_3DES_EDE_CBC_SHA = 0x008F,
	TLS_DHE_PSK_WITH_AES_128_CBC_SHA = 0x0090,
	TLS_DHE_PSK_WITH_AES_256_CBC_SHA = 0x0091,
	TLS_RSA_PSK_WITH_RC4_128_SHA = 0x0092,
	TLS_RSA_PSK_WITH_3DES_EDE_CBC_SHA = 0x0093,
	TLS_RSA_PSK_WITH_AES_128_CBC_SHA = 0x0094,
	TLS_RSA_PSK_WITH_AES_256_CBC_SHA = 0x0095,
	TLS_RSA_WITH_SEED_CBC_SHA = 0x0096,
	TLS_DH_DSS_WITH_SEED_CBC_SHA = 0x0097,
	TLS_DH_RSA_WITH_SEED_CBC_SHA = 0x0098,
	TLS_DHE_DSS_WITH_SEED_CBC_SHA = 0x0099,
	TLS_DHE_RSA_WITH_SEED_CBC_SHA = 0x009A,
	TLS_DH_ANON_WITH_SEED_CBC_SHA = 0x009B,
	TLS_RSA_WITH_AES_128_GCM_SHA256 = 0x009C,
	TLS_RSA_WITH_AES_256_GCM_SHA384 = 0x009D,
	TLS_DHE_RSA_WITH_AES_128_GCM_SHA256 = 0x009E,
	TLS_DHE_RSA_WITH_AES_256_GCM_SHA384 = 0x009F,
	TLS_DH_RSA_WITH_AES_128_GCM_SHA256 = 0x00A0,
	TLS_DH_RSA_WITH_AES_256_GCM_SHA384 = 0x00A1,
	TLS_DHE_DSS_WITH_AES_128_GCM_SHA256 = 0x00A2,
	TLS_DHE_DSS_WITH_AES_256_GCM_SHA384 = 0x00A3,
	TLS_DH_DSS_WITH_AES_128_GCM_SHA256 = 0x00A4,
	TLS_DH_DSS_WITH_AES_256_GCM_SHA384 = 0x00A5,
	TLS_DH_ANON_WITH_AES_128_GCM_SHA256 = 0x00A6,
	TLS_DH_ANON_WITH_AES_256_GCM_SHA384 = 0x00A7,
	TLS_PSK_WITH_AES_128_GCM_SHA256 = 0x00A8,
	TLS_PSK_WITH_AES_256_GCM_SHA384 = 0x00A9,
	TLS_DHE_PSK_WITH_AES_128_GCM_SHA256 = 0x00AA,
	TLS_DHE_PSK_WITH_AES_256_GCM_SHA384 = 0x00AB,
	TLS_RSA_PSK_WITH_AES_128_GCM_SHA256 = 0x00AC,
	TLS_RSA_PSK_WITH_AES_256_GCM_SHA384 = 0x00AD,
	TLS_PSK_WITH_AES_128_CBC_SHA256 = 0x00AE,
	TLS_PSK_WITH_AES_256_CBC_SHA384 = 0x00AF,
	TLS_PSK_WITH_NULL_SHA256 = 0x00B0,
	TLS_PSK_WITH_NULL_SHA384 = 0x00B1,
	TLS_DHE_PSK_WITH_AES_128_CBC_SHA256 = 0x00B2,
	TLS_DHE_PSK_WITH_AES_256_CBC_SHA384 = 0x00B3,
	TLS_DHE_PSK_WITH_NULL_SHA256 = 0x00B4,
	TLS_DHE_PSK_WITH_NULL_SHA384 = 0x00B5,
	TLS_RSA_PSK_WITH_AES_128_CBC_SHA256 = 0x00B6,
	TLS_RSA_PSK_WITH_AES_256_CBC_SHA384 = 0x00B7,
	TLS_RSA_PSK_WITH_NULL_SHA256 = 0x00B8,
	TLS_RSA_PSK_WITH_NULL_SHA384 = 0x00B9,
	TLS_RSA_WITH_CAMELLIA_128_CBC_SHA256 = 0x00BA,
	TLS_DH_DSS_WITH_CAMELLIA_128_CBC_SHA256 = 0x00BB,
	TLS_DH_RSA_WITH_CAMELLIA_128_CBC_SHA256 = 0x00BC,
	TLS_DHE_DSS_WITH_CAMELLIA_128_CBC_SHA256 = 0x00BD,
	TLS_DHE_RSA_WITH_CAMELLIA_128_CBC_SHA256 = 0x00BE,
	TLS_DH_ANON_WITH_CAMELLIA_128_CBC_SHA256 = 0x00BF,
	TLS_RSA_WITH_CAMELLIA_256_CBC_SHA256 = 0x00C0,
	TLS_DH_DSS_WITH_CAMELLIA_256_CBC_SHA256 = 0x00C1,
	TLS_DH_RSA_WITH_CAMELLIA_256_CBC_SHA256 = 0x00C2,
	TLS_DHE_DSS_WITH_CAMELLIA_256_CBC_SHA256 = 0x00C3,
	TLS_DHE_RSA_WITH_CAMELLIA_256_CBC_SHA256 = 0x00C4,
	TLS_DH_ANON_WITH_CAMELLIA_256_CBC_SHA256 = 0x00C5,
	# draft-bmoeller-tls-downgrade-scsv-01
	TLS_FALLBACK_SCSV = 0x5600,
	# RFC 4492
	TLS_ECDH_ECDSA_WITH_NULL_SHA = 0xC001,
	TLS_ECDH_ECDSA_WITH_RC4_128_SHA = 0xC002,
	TLS_ECDH_ECDSA_WITH_3DES_EDE_CBC_SHA = 0xC003,
	TLS_ECDH_ECDSA_WITH_AES_128_CBC_SHA = 0xC004,
	TLS_ECDH_ECDSA_WITH_AES_256_CBC_SHA = 0xC005,
	TLS_ECDHE_ECDSA_WITH_NULL_SHA = 0xC006,
	TLS_ECDHE_ECDSA_WITH_RC4_128_SHA = 0xC007,
	TLS_ECDHE_ECDSA_WITH_3DES_EDE_CBC_SHA = 0xC008,
	TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA = 0xC009,
	TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA = 0xC00A,
	TLS_ECDH_RSA_WITH_NULL_SHA = 0xC00B,
	TLS_ECDH_RSA_WITH_RC4_128_SHA = 0xC00C,
	TLS_ECDH_RSA_WITH_3DES_EDE_CBC_SHA = 0xC00D,
	TLS_ECDH_RSA_WITH_AES_128_CBC_SHA = 0xC00E,
	TLS_ECDH_RSA_WITH_AES_256_CBC_SHA = 0xC00F,
	TLS_ECDHE_RSA_WITH_NULL_SHA = 0xC010,
	TLS_ECDHE_RSA_WITH_RC4_128_SHA = 0xC011,
	TLS_ECDHE_RSA_WITH_3DES_EDE_CBC_SHA = 0xC012,
	TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA = 0xC013,
	TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA = 0xC014,
	TLS_ECDH_ANON_WITH_NULL_SHA = 0xC015,
	TLS_ECDH_ANON_WITH_RC4_128_SHA = 0xC016,
	TLS_ECDH_ANON_WITH_3DES_EDE_CBC_SHA = 0xC017,
	TLS_ECDH_ANON_WITH_AES_128_CBC_SHA = 0xC018,
	TLS_ECDH_ANON_WITH_AES_256_CBC_SHA = 0xC019,
	TLS_SRP_SHA_WITH_3DES_EDE_CBC_SHA = 0xC01A,
	TLS_SRP_SHA_RSA_WITH_3DES_EDE_CBC_SHA = 0xC01B,
	TLS_SRP_SHA_DSS_WITH_3DES_EDE_CBC_SHA = 0xC01C,
	TLS_SRP_SHA_WITH_AES_128_CBC_SHA = 0xC01D,
	TLS_SRP_SHA_RSA_WITH_AES_128_CBC_SHA = 0xC01E,
	TLS_SRP_SHA_DSS_WITH_AES_128_CBC_SHA = 0xC01F,
	TLS_SRP_SHA_WITH_AES_256_CBC_SHA = 0xC020,
	TLS_SRP_SHA_RSA_WITH_AES_256_CBC_SHA = 0xC021,
	TLS_SRP_SHA_DSS_WITH_AES_256_CBC_SHA = 0xC022,
	TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256 = 0xC023,
	TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA384 = 0xC024,
	TLS_ECDH_ECDSA_WITH_AES_128_CBC_SHA256 = 0xC025,
	TLS_ECDH_ECDSA_WITH_AES_256_CBC_SHA384 = 0xC026,
	TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256 = 0xC027,
	TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384 = 0xC028,
	TLS_ECDH_RSA_WITH_AES_128_CBC_SHA256 = 0xC029,
	TLS_ECDH_RSA_WITH_AES_256_CBC_SHA384 = 0xC02A,
	TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256 = 0xC02B,
	TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384 = 0xC02C,
	TLS_ECDH_ECDSA_WITH_AES_128_GCM_SHA256 = 0xC02D,
	TLS_ECDH_ECDSA_WITH_AES_256_GCM_SHA384 = 0xC02E,
	TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256 = 0xC02F,
	TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384 = 0xC030,
	TLS_ECDH_RSA_WITH_AES_128_GCM_SHA256 = 0xC031,
	TLS_ECDH_RSA_WITH_AES_256_GCM_SHA384 = 0xC032,
	TLS_ECDHE_PSK_WITH_RC4_128_SHA = 0xC033,
	TLS_ECDHE_PSK_WITH_3DES_EDE_CBC_SHA = 0xC034,
	TLS_ECDHE_PSK_WITH_AES_128_CBC_SHA = 0xC035,
	TLS_ECDHE_PSK_WITH_AES_256_CBC_SHA = 0xC036,
	TLS_ECDHE_PSK_WITH_AES_128_CBC_SHA256 = 0xC037,
	TLS_ECDHE_PSK_WITH_AES_256_CBC_SHA384 = 0xC038,
	TLS_ECDHE_PSK_WITH_NULL_SHA = 0xC039,
	TLS_ECDHE_PSK_WITH_NULL_SHA256 = 0xC03A,
	TLS_ECDHE_PSK_WITH_NULL_SHA384 = 0xC03B,
	# RFC 6209
	TLS_RSA_WITH_ARIA_128_CBC_SHA256 = 0xC03C,
	TLS_RSA_WITH_ARIA_256_CBC_SHA384 = 0xC03D,
	TLS_DH_DSS_WITH_ARIA_128_CBC_SHA256 = 0xC03E,
	TLS_DH_DSS_WITH_ARIA_256_CBC_SHA384 = 0xC03F,
	TLS_DH_RSA_WITH_ARIA_128_CBC_SHA256 = 0xC040,
	TLS_DH_RSA_WITH_ARIA_256_CBC_SHA384 = 0xC041,
	TLS_DHE_DSS_WITH_ARIA_128_CBC_SHA256 = 0xC042,
	TLS_DHE_DSS_WITH_ARIA_256_CBC_SHA384 = 0xC043,
	TLS_DHE_RSA_WITH_ARIA_128_CBC_SHA256 = 0xC044,
	TLS_DHE_RSA_WITH_ARIA_256_CBC_SHA384 = 0xC045,
	TLS_DH_ANON_WITH_ARIA_128_CBC_SHA256 = 0xC046,
	TLS_DH_ANON_WITH_ARIA_256_CBC_SHA384 = 0xC047,
	TLS_ECDHE_ECDSA_WITH_ARIA_128_CBC_SHA256 = 0xC048,
	TLS_ECDHE_ECDSA_WITH_ARIA_256_CBC_SHA384 = 0xC049,
	TLS_ECDH_ECDSA_WITH_ARIA_128_CBC_SHA256 = 0xC04A,
	TLS_ECDH_ECDSA_WITH_ARIA_256_CBC_SHA384 = 0xC04B,
	TLS_ECDHE_RSA_WITH_ARIA_128_CBC_SHA256 = 0xC04C,
	TLS_ECDHE_RSA_WITH_ARIA_256_CBC_SHA384 = 0xC04D,
	TLS_ECDH_RSA_WITH_ARIA_128_CBC_SHA256 = 0xC04E,
	TLS_ECDH_RSA_WITH_ARIA_256_CBC_SHA384 = 0xC04F,
	TLS_RSA_WITH_ARIA_128_GCM_SHA256 = 0xC050,
	TLS_RSA_WITH_ARIA_256_GCM_SHA384 = 0xC051,
	TLS_DHE_RSA_WITH_ARIA_128_GCM_SHA256 = 0xC052,
	TLS_DHE_RSA_WITH_ARIA_256_GCM_SHA384 = 0xC053,
	TLS_DH_RSA_WITH_ARIA_128_GCM_SHA256 = 0xC054,
	TLS_DH_RSA_WITH_ARIA_256_GCM_SHA384 = 0xC055,
	TLS_DHE_DSS_WITH_ARIA_128_GCM_SHA256 = 0xC056,
	TLS_DHE_DSS_WITH_ARIA_256_GCM_SHA384 = 0xC057,
	TLS_DH_DSS_WITH_ARIA_128_GCM_SHA256 = 0xC058,
	TLS_DH_DSS_WITH_ARIA_256_GCM_SHA384 = 0xC059,
	TLS_DH_ANON_WITH_ARIA_128_GCM_SHA256 = 0xC05A,
	TLS_DH_ANON_WITH_ARIA_256_GCM_SHA384 = 0xC05B,
	TLS_ECDHE_ECDSA_WITH_ARIA_128_GCM_SHA256 = 0xC05C,
	TLS_ECDHE_ECDSA_WITH_ARIA_256_GCM_SHA384 = 0xC05D,
	TLS_ECDH_ECDSA_WITH_ARIA_128_GCM_SHA256 = 0xC05E,
	TLS_ECDH_ECDSA_WITH_ARIA_256_GCM_SHA384 = 0xC05F,
	TLS_ECDHE_RSA_WITH_ARIA_128_GCM_SHA256 = 0xC060,
	TLS_ECDHE_RSA_WITH_ARIA_256_GCM_SHA384 = 0xC061,
	TLS_ECDH_RSA_WITH_ARIA_128_GCM_SHA256 = 0xC062,
	TLS_ECDH_RSA_WITH_ARIA_256_GCM_SHA384 = 0xC063,
	TLS_PSK_WITH_ARIA_128_CBC_SHA256 = 0xC064,
	TLS_PSK_WITH_ARIA_256_CBC_SHA384 = 0xC065,
	TLS_DHE_PSK_WITH_ARIA_128_CBC_SHA256 = 0xC066,
	TLS_DHE_PSK_WITH_ARIA_256_CBC_SHA384 = 0xC067,
	TLS_RSA_PSK_WITH_ARIA_128_CBC_SHA256 = 0xC068,
	TLS_RSA_PSK_WITH_ARIA_256_CBC_SHA384 = 0xC069,
	TLS_PSK_WITH_ARIA_128_GCM_SHA256 = 0xC06A,
	TLS_PSK_WITH_ARIA_256_GCM_SHA384 = 0xC06B,
	TLS_DHE_PSK_WITH_ARIA_128_GCM_SHA256 = 0xC06C,
	TLS_DHE_PSK_WITH_ARIA_256_GCM_SHA384 = 0xC06D,
	TLS_RSA_PSK_WITH_ARIA_128_GCM_SHA256 = 0xC06E,
	TLS_RSA_PSK_WITH_ARIA_256_GCM_SHA384 = 0xC06F,
	TLS_ECDHE_PSK_WITH_ARIA_128_CBC_SHA256 = 0xC070,
	TLS_ECDHE_PSK_WITH_ARIA_256_CBC_SHA384 = 0xC071,
	# RFC 6367
	TLS_ECDHE_ECDSA_WITH_CAMELLIA_128_CBC_SHA256 = 0xC072,
	TLS_ECDHE_ECDSA_WITH_CAMELLIA_256_CBC_SHA384 = 0xC073,
	TLS_ECDH_ECDSA_WITH_CAMELLIA_128_CBC_SHA256 = 0xC074,
	TLS_ECDH_ECDSA_WITH_CAMELLIA_256_CBC_SHA384 = 0xC075,
	TLS_ECDHE_RSA_WITH_CAMELLIA_128_CBC_SHA256 = 0xC076,
	TLS_ECDHE_RSA_WITH_CAMELLIA_256_CBC_SHA384 = 0xC077,
	TLS_ECDH_RSA_WITH_CAMELLIA_128_CBC_SHA256 = 0xC078,
	TLS_ECDH_RSA_WITH_CAMELLIA_256_CBC_SHA384 = 0xC079,
	TLS_RSA_WITH_CAMELLIA_128_GCM_SHA256 = 0xC07A,
	TLS_RSA_WITH_CAMELLIA_256_GCM_SHA384 = 0xC07B,
	TLS_DHE_RSA_WITH_CAMELLIA_128_GCM_SHA256 = 0xC07C,
	TLS_DHE_RSA_WITH_CAMELLIA_256_GCM_SHA384 = 0xC07D,
	TLS_DH_RSA_WITH_CAMELLIA_128_GCM_SHA256 = 0xC07E,
	TLS_DH_RSA_WITH_CAMELLIA_256_GCM_SHA384 = 0xC07F,
	TLS_DHE_DSS_WITH_CAMELLIA_128_GCM_SHA256 = 0xC080,
	TLS_DHE_DSS_WITH_CAMELLIA_256_GCM_SHA384 = 0xC081,
	TLS_DH_DSS_WITH_CAMELLIA_128_GCM_SHA256 = 0xC082,
	TLS_DH_DSS_WITH_CAMELLIA_256_GCM_SHA384 = 0xC083,
	TLS_DH_ANON_WITH_CAMELLIA_128_GCM_SHA256 = 0xC084,
	TLS_DH_ANON_WITH_CAMELLIA_256_GCM_SHA384 = 0xC085,
	TLS_ECDHE_ECDSA_WITH_CAMELLIA_128_GCM_SHA256 = 0xC086,
	TLS_ECDHE_ECDSA_WITH_CAMELLIA_256_GCM_SHA384 = 0xC087,
	TLS_ECDH_ECDSA_WITH_CAMELLIA_128_GCM_SHA256 = 0xC088,
	TLS_ECDH_ECDSA_WITH_CAMELLIA_256_GCM_SHA384 = 0xC089,
	TLS_ECDHE_RSA_WITH_CAMELLIA_128_GCM_SHA256 = 0xC08A,
	TLS_ECDHE_RSA_WITH_CAMELLIA_256_GCM_SHA384 = 0xC08B,
	TLS_ECDH_RSA_WITH_CAMELLIA_128_GCM_SHA256 = 0xC08C,
	TLS_ECDH_RSA_WITH_CAMELLIA_256_GCM_SHA384 = 0xC08D,
	TLS_PSK_WITH_CAMELLIA_128_GCM_SHA256 = 0xC08E,
	TLS_PSK_WITH_CAMELLIA_256_GCM_SHA384 = 0xC08F,
	TLS_DHE_PSK_WITH_CAMELLIA_128_GCM_SHA256 = 0xC090,
	TLS_DHE_PSK_WITH_CAMELLIA_256_GCM_SHA384 = 0xC091,
	TLS_RSA_PSK_WITH_CAMELLIA_128_GCM_SHA256 = 0xC092,
	TLS_RSA_PSK_WITH_CAMELLIA_256_GCM_SHA384 = 0xC093,
	TLS_PSK_WITH_CAMELLIA_128_CBC_SHA256 = 0xC094,
	TLS_PSK_WITH_CAMELLIA_256_CBC_SHA384 = 0xC095,
	TLS_DHE_PSK_WITH_CAMELLIA_128_CBC_SHA256 = 0xC096,
	TLS_DHE_PSK_WITH_CAMELLIA_256_CBC_SHA384 = 0xC097,
	TLS_RSA_PSK_WITH_CAMELLIA_128_CBC_SHA256 = 0xC098,
	TLS_RSA_PSK_WITH_CAMELLIA_256_CBC_SHA384 = 0xC099,
	TLS_ECDHE_PSK_WITH_CAMELLIA_128_CBC_SHA256 = 0xC09A,
	TLS_ECDHE_PSK_WITH_CAMELLIA_256_CBC_SHA384 = 0xC09B,
	# RFC 6655
	TLS_RSA_WITH_AES_128_CCM = 0xC09C,
	TLS_RSA_WITH_AES_256_CCM = 0xC09D,
	TLS_DHE_RSA_WITH_AES_128_CCM = 0xC09E,
	TLS_DHE_RSA_WITH_AES_256_CCM = 0xC09F,
	TLS_RSA_WITH_AES_128_CCM_8 = 0xC0A0,
	TLS_RSA_WITH_AES_256_CCM_8 = 0xC0A1,
	TLS_DHE_RSA_WITH_AES_128_CCM_8 = 0xC0A2,
	TLS_DHE_RSA_WITH_AES_256_CCM_8 = 0xC0A3,
	TLS_PSK_WITH_AES_128_CCM = 0xC0A4,
	TLS_PSK_WITH_AES_256_CCM = 0xC0A5,
	TLS_DHE_PSK_WITH_AES_128_CCM = 0xC0A6,
	TLS_DHE_PSK_WITH_AES_256_CCM = 0xC0A7,
	TLS_PSK_WITH_AES_128_CCM_8 = 0xC0A8,
	TLS_PSK_WITH_AES_256_CCM_8 = 0xC0A9,
	TLS_PSK_DHE_WITH_AES_128_CCM_8 = 0xC0AA,
	TLS_PSK_DHE_WITH_AES_256_CCM_8 = 0xC0AB,
	TLS_ECDHE_ECDSA_WITH_AES_128_CCM = 0xC0AC,
	TLS_ECDHE_ECDSA_WITH_AES_256_CCM = 0xC0AD,
	TLS_ECDHE_ECDSA_WITH_AES_128_CCM_8 = 0xC0AE,
	TLS_ECDHE_ECDSA_WITH_AES_256_CCM_8 = 0xC0AF,
	# draft-agl-tls-chacha20poly1305-02
	TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256 = 0xCC13,
	TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256 = 0xCC14,
	TLS_DHE_RSA_WITH_CHACHA20_POLY1305_SHA256 = 0xCC15
};
