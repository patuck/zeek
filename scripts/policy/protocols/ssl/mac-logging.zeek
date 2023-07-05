##! This script adds link-layer address (MAC) information to the ssl logs

@load base/protocols/ssl

module SSL;

redef record Info += {
	## Link-layer address of the originator, if available.
	orig_l2_addr: string	&log &optional;
	## Link-layer address of the responder, if available.
	resp_l2_addr: string	&log &optional;
};

# Add the link-layer addresses to the SSL::Info structure.
event ssl_extension(c: connection, is_client: bool, code: count, val: string)
	{
	if ( c$orig?$l2_addr )
		c$ssl$orig_l2_addr = c$orig$l2_addr;

	if ( c$resp?$l2_addr )
		c$ssl$resp_l2_addr = c$resp$l2_addr;
	}